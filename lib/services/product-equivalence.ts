import axios from 'axios'
import { getApiKey } from '@/lib/api/config'
import { aiTracker } from '@/lib/ai/tracker'
import { logEvent, detectErrorKind } from '@/lib/services/scraper-health'

/**
 * Product Equivalence Engine
 *
 * The core of Julyu's value: deciding which candidate products from
 * different retailers are *actually* the same thing the user asked for,
 * and computing a per-unit price so totals are comparable.
 *
 * Why this exists: when a user types "chicken breast", search APIs
 * return everything containing that phrase — including 2.6oz snack
 * pouches, frozen pre-cooked strips, 15-lb wholesale cases, and deli
 * cuts. A naive comparison ranks the 2.6oz pouch as "cheapest" at $1.89
 * even though it's a totally different product. This service uses
 * DeepSeek to filter to true matches and normalize size, then computes
 * price-per-pound (or per-oz for liquids) so the ranking is correct.
 *
 * Pipeline:
 * 1. Caller hands us the user query + a flat list of price candidates
 * pulled from Kroger / Walmart / Target / Flipp / DB.
 * 2. We build a single DeepSeek call that classifies all candidates
 * against the query, returning structured JSON.
 * 3. We compute price_per_unit and attach it to each candidate.
 * 4. Caller filters by is_match + (optionally) is_wholesale.
 *
 * Cost: ~$0.001 per query (DeepSeek-Chat input is ~$0.14/M tokens,
 * a 50-candidate batch is ~2000 tokens in, ~2500 out). Phase 4 will
 * cache classifications per SKU to amortize.
 *
 * Failure mode: if DeepSeek fails, we return the candidates UNCLASSIFIED
 * (is_match=true for all, default size, no per-unit math). That way the
 * comparison page still shows something — just less accurate.
 */

import crypto from 'crypto'

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

// 7 days — Flipp weekly ads roll over weekly, so classifications beyond this
// window are unlikely to apply to a still-current product listing.
const CLASSIFICATION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Stable cache key per (userQuery, candidate identity). Same product asked for
 * the same intent same classification.
 *
 * We hash on userQuery + productName + brand + size rather than candidate.id
 * because the same physical product can have different ids across sources
 * (e.g. "Just Bare Chicken Breast" might be flipp-1234 on Flipp and tcin-5678
 * on Target). Hashing on identity instead of id lets the cache hit across sources.
 */
function classificationCacheKey(userQuery: string, c: PriceCandidate): string {
 const normalize = (s: string | undefined) =>
 (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
 const payload = JSON.stringify({
 q: normalize(userQuery),
 n: normalize(c.productName),
 b: normalize(c.brand),
 s: normalize(c.size),
 })
 return crypto.createHash('sha1').update(payload).digest('hex')
}

async function loadCachedClassifications(
 userQuery: string,
 candidates: PriceCandidate[],
): Promise<Map<string, CandidateClassification>> {
 const out = new Map<string, CandidateClassification>()
 if (candidates.length === 0) return out

 try {
 const { createServiceRoleClient } = await import('@/lib/supabase/server')
 const supabase = createServiceRoleClient() as any
 const keys = candidates.map((c) => classificationCacheKey(userQuery, c))

 const { data, error } = await supabase
 .from('api_search_cache')
 .select('search_query_normalized, results')
 .eq('api_name', 'equivalence')
 .in('search_query_normalized', keys)
 .gt('expires_at', new Date().toISOString())

 if (error || !data) return out

 // Map cache hash candidate id by walking candidates in input order
 const keyToCandidate = new Map<string, PriceCandidate>()
 candidates.forEach((c, i) => keyToCandidate.set(keys[i], c))

 for (const row of data) {
 const candidate = keyToCandidate.get(row.search_query_normalized)
 if (!candidate) continue
 const cls = row.results as Omit<CandidateClassification, 'id'>
 // Rebind id to THIS candidate's id (the cached one was for a different id)
 out.set(candidate.id, { ...cls, id: candidate.id })
 }
 if (out.size > 0) {
 console.log(`[Equivalence] Cache HIT ${out.size}/${candidates.length} for "${userQuery}"`)
 }
 } catch (e) {
 console.error('[Equivalence] Cache lookup error:', e)
 }
 return out
}

async function saveCachedClassifications(
 userQuery: string,
 classifications: Array<{ candidate: PriceCandidate; classification: CandidateClassification }>,
): Promise<void> {
 if (classifications.length === 0) return
 try {
 const { createServiceRoleClient } = await import('@/lib/supabase/server')
 const supabase = createServiceRoleClient() as any
 const expiresAt = new Date(Date.now() + CLASSIFICATION_CACHE_TTL_MS).toISOString()

 const rows = classifications.map(({ candidate, classification }) => {
 const key = classificationCacheKey(userQuery, candidate)
 // Strip id from stored classification — we rebind on read
 const { id: _id, ...rest } = classification
 return {
 api_name: 'equivalence',
 search_query: userQuery,
 search_query_normalized: key,
 location_id: null,
 results: rest,
 result_count: 1,
 expires_at: expiresAt,
 hit_count: 0,
 created_at: new Date().toISOString(),
 }
 })

 const { error } = await supabase
 .from('api_search_cache')
 .upsert(rows, { onConflict: 'api_name,search_query_normalized,location_id' })

 if (error) {
 console.error('[Equivalence] Cache save error:', error)
 }
 } catch (e) {
 console.error('[Equivalence] Cache save error:', e)
 }
}

export type ProductForm =
 | 'fresh'
 | 'frozen'
 | 'canned'
 | 'cooked'
 | 'deli'
 | 'shelf-stable'
 | 'prepared'
 | 'other'

export type SizeUnit = 'lb' | 'oz' | 'fl-oz' | 'count' | 'gal' | 'l' | 'unknown'

export interface PriceCandidate {
 /** Stable id within the source — used to join classifications back to candidates */
 id: string
 source: 'kroger' | 'walmart' | 'target' | 'flipp' | 'database' | 'bodega'
 retailer: string
 retailerSlug?: string
 productName: string
 brand?: string
 /** Raw size string as returned by the source (e.g. "2.6oz", "1 gal", "per lb") */
 size?: string
 price: number
 salePrice?: number
 imageUrl?: string
 /** Pre-price text from the source — e.g. "with $10 purchase" / "must buy 2". */
 preText?: string
 /** Post-price text — e.g. "Save $1" / "Members only". */
 postText?: string
 /** Sale narrative — e.g. "BOGO Free!" / "Buy 2 get 1 free". */
 saleStory?: string
 /** When this price expires (Flipp weekly ads). ISO 8601. */
 validTo?: string
 /** Original source-specific record, kept so callers can drill into details */
 raw?: unknown
}

export interface CandidateClassification {
 id: string
 isMatch: boolean
 form: ProductForm
 estimatedSize: number
 estimatedSizeUnit: SizeUnit
 isWholesaleQuantity: boolean
 /** True if listed price requires a condition the user might not meet
 * (e.g. "$0.79 with $10 purchase"). When true, the pricePerUnit
 * shouldn't be treated as the true comparable unit price. */
 hasConditionalPricing: boolean
 reasoning?: string
 confidence: number
}

export interface ClassifiedCandidate extends PriceCandidate {
 classification: CandidateClassification
 /** price / size_lb or size_oz — canonical to whatever unit the user query implies */
 pricePerUnit: number | null
 pricePerUnitFormatted: string | null
 /** The unit we ended up normalizing to */
 normalizedUnit: SizeUnit | null
}

const WHOLESALE_RETAILER_SLUGS = new Set([
 // Flipp emits these with apostrophes; we strip them via isWholesaleSlug below.
 'samsclub',
 'costco',
 'bjswholesaleclub',
 'restaurantdepot',
 'cosco',
])

function normalizeSlug(slug: string | undefined): string {
 if (!slug) return ''
 // Strip non-alphanumerics so "sam's-club", "sams-club", "Sam's Club" all collapse.
 return slug.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isWholesaleSlug(slug: string | undefined): boolean {
 return WHOLESALE_RETAILER_SLUGS.has(normalizeSlug(slug))
}

/**
 * Best-effort regex parser to estimate size when DeepSeek isn't available
 * or returns junk. Catches the common cases (e.g. "16 oz", "1 lb", "1 gal").
 */
function parseSizeFallback(
 name: string,
 size?: string,
): { value: number; unit: SizeUnit } {
 const haystack = `${size || ''} ${name}`.toLowerCase()

 // Per-pound pricing (deli cuts, fresh meat sold by weight)
 if (/(\bper\s*lb|\$\/lb|\/lb\b|priced per pound)/i.test(haystack)) {
 return { value: 1, unit: 'lb' }
 }

 const lbMatch = haystack.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound)/)
 if (lbMatch) return { value: parseFloat(lbMatch[1]), unit: 'lb' }

 const ozMatch = haystack.match(/(\d+(?:\.\d+)?)\s*(?:fl\.?\s*oz|fluid oz)/)
 if (ozMatch) return { value: parseFloat(ozMatch[1]), unit: 'fl-oz' }

 const dryOzMatch = haystack.match(/(\d+(?:\.\d+)?)\s*oz/)
 if (dryOzMatch) return { value: parseFloat(dryOzMatch[1]), unit: 'oz' }

 const galMatch = haystack.match(/(\d+(?:\.\d+)?)\s*gal/)
 if (galMatch) return { value: parseFloat(galMatch[1]), unit: 'gal' }

 const countMatch = haystack.match(/(\d+)\s*(?:ct|count|pk|pack|dozen)/)
 if (countMatch) {
 const value = /dozen/.test(haystack) ? 12 : parseFloat(countMatch[1])
 return { value, unit: 'count' }
 }

 return { value: 1, unit: 'unknown' }
}

/**
 * Pick the canonical comparison unit for a given user query.
 * Liquids fl-oz, eggs count, everything else lb.
 */
function pickCanonicalUnit(userQuery: string): SizeUnit {
 const q = userQuery.toLowerCase()
 if (/milk|juice|water|soda|cream|broth|stock|oil|vinegar|sauce/.test(q)) return 'fl-oz'
 if (/egg/.test(q)) return 'count'
 return 'lb'
}

/**
 * Convert (value, unit) canonical unit. Returns null if no sane conversion.
 */
function convertToCanonical(
 value: number,
 fromUnit: SizeUnit,
 toUnit: SizeUnit,
): number | null {
 if (value <= 0 || !isFinite(value)) return null
 if (fromUnit === toUnit) return value
 if (fromUnit === 'unknown' || toUnit === 'unknown') return null

 // Weight conversions (lb oz)
 if (toUnit === 'lb') {
 if (fromUnit === 'oz') return value / 16
 if (fromUnit === 'lb') return value
 return null
 }
 if (toUnit === 'oz') {
 if (fromUnit === 'lb') return value * 16
 if (fromUnit === 'oz') return value
 return null
 }

 // Volume conversions (fl-oz gal l)
 if (toUnit === 'fl-oz') {
 if (fromUnit === 'gal') return value * 128
 if (fromUnit === 'l') return value * 33.814
 if (fromUnit === 'fl-oz') return value
 return null
 }
 if (toUnit === 'gal') {
 if (fromUnit === 'fl-oz') return value / 128
 if (fromUnit === 'l') return value / 3.785
 if (fromUnit === 'gal') return value
 return null
 }

 // Count stays as count
 if (toUnit === 'count' && fromUnit === 'count') return value

 return null
}

function formatUnit(unit: SizeUnit): string {
 switch (unit) {
 case 'lb':
 return '/lb'
 case 'oz':
 return '/oz'
 case 'fl-oz':
 return '/fl oz'
 case 'gal':
 return '/gal'
 case 'l':
 return '/L'
 case 'count':
 return ' ea'
 default:
 return ''
 }
}

function buildPrompt(userQuery: string, candidates: PriceCandidate[]): string {
 const candidateLines = candidates
 .map((c, i) => {
 const sizeStr = c.size ? ` | size: ${c.size}` : ''
 const brandStr = c.brand ? ` | brand: ${c.brand}` : ''
 const sale = c.salePrice && c.salePrice !== c.price ? ` (sale $${c.salePrice})` : ''
 // Deal-context hints help the classifier decide when a number is misleading
 // (e.g. "$0.79 with $10 purchase" or "$5 for 2" should NOT be treated as a
 // straight unit price — flag those via has_conditional_pricing).
 const dealParts: string[] = []
 if (c.preText) dealParts.push(`pre:"${c.preText}"`)
 if (c.postText) dealParts.push(`post:"${c.postText}"`)
 if (c.saleStory) dealParts.push(`story:"${c.saleStory}"`)
 const deal = dealParts.length > 0 ? ` | DEAL: ${dealParts.join(' ')}` : ''
 return `${i + 1}. id=${c.id} | ${c.retailer} | "${c.productName}"${brandStr}${sizeStr} | $${c.price}${sale}${deal}`
 })
 .join('\n')

 return `User is shopping for: "${userQuery}"

Below is a list of candidate products from various retailers. For EACH candidate, decide:
1. is_match: true ONLY if this is a reasonable equivalent of what the user wants to buy. Reject canned/snack-pouch versions when they asked for fresh, reject seasoned/cooked when they asked for raw, reject pet food, reject wildly different products that just share a keyword.
2. form: one of: fresh, frozen, canned, cooked, deli, shelf-stable, prepared, other
3. estimated_size: a number, the size of the package
4. estimated_size_unit: one of: lb, oz, fl-oz, count, gal, l, unknown
 - For items sold "per pound" (deli, fresh meat), use size=1, unit=lb
 - For "1 dozen" eggs, use size=12, unit=count
5. is_wholesale: true if this is clearly a club-store bulk pack or restaurant-supply case (e.g. 15-lb case, 3-pack of gallons)
6. has_conditional_pricing: true if the DEAL annotation contains a requirement that makes the listed price NOT the true unit price (e.g. "with $10 purchase", "must buy 2 or more", "members only", "limit 1"). false if the price is straightforward or there's no DEAL annotation. Multipack pricing like "2/$5" is NOT conditional — the price per unit is clear.
7. confidence: 0.0 to 1.0
8. reasoning: ONE short phrase (≤ 10 words)

Candidates:
${candidateLines}

Return JSON with EXACTLY this shape (no markdown, no commentary):
{
 "results": [
 { "id": "<id>", "is_match": true|false, "form": "fresh"|..., "estimated_size": <num>, "estimated_size_unit": "lb"|..., "is_wholesale": true|false, "has_conditional_pricing": true|false, "confidence": <num>, "reasoning": "<text>" }
 ]
}`
}

async function callDeepSeek(prompt: string): Promise<{ results: any[] } | null> {
 const startedAt = Date.now()
 try {
 const apiKey = await getApiKey('deepseek-chat')
 if (!apiKey) {
 console.warn('[Equivalence] DeepSeek not configured — falling back to passthrough')
 logEvent({
 source: 'equivalence',
 operation: 'classify',
 success: false,
 errorKind: 'no_key',
 errorMessage: 'DeepSeek API key not configured',
 })
 return null
 }

 const response = await axios.post(
 `${DEEPSEEK_BASE_URL}/v1/chat/completions`,
 {
 model: 'deepseek-chat',
 messages: [
 {
 role: 'system',
 content:
 'You are a precise grocery product classifier. You only return valid JSON. You never guess wildly — when uncertain, mark is_match=false rather than include a mismatched product.',
 },
 { role: 'user', content: prompt },
 ],
 temperature: 0.1,
 response_format: { type: 'json_object' },
 },
 {
 headers: {
 Authorization: `Bearer ${apiKey.trim()}`,
 'Content-Type': 'application/json',
 },
 timeout: 30000,
 },
 )

 const content = response.data.choices?.[0]?.message?.content
 if (!content) return null
 const parsed = JSON.parse(content)

 // Best-effort usage tracking
 const usage = response.data.usage
 const cost = usage
 ? aiTracker.calculateCost(
 'deepseek-chat',
 usage.prompt_tokens || 0,
 usage.completion_tokens || 0,
 )
 : 0
 if (usage) {
 aiTracker
 .trackUsage({
 model_name: 'deepseek-chat',
 provider: 'DeepSeek',
 use_case: 'equivalence_classification',
 input_tokens: usage.prompt_tokens || 0,
 output_tokens: usage.completion_tokens || 0,
 response_time_ms: Date.now() - startedAt,
 cost,
 success: true,
 })
 .catch(() => {})
 }

 logEvent({
 source: 'equivalence',
 operation: 'classify',
 success: true,
 latencyMs: Date.now() - startedAt,
 resultCount: Array.isArray(parsed?.results) ? parsed.results.length : 0,
 inputTokens: usage?.prompt_tokens,
 outputTokens: usage?.completion_tokens,
 costUsd: cost,
 })
 return parsed
 } catch (e: any) {
 console.error('[Equivalence] DeepSeek call failed:', e.response?.status, e.message)
 const status = e.response?.status
 const bodyPreview =
 typeof e.response?.data === 'string'
 ? e.response.data
 : JSON.stringify(e.response?.data || {}).substring(0, 200)
 logEvent({
 source: 'equivalence',
 operation: 'classify',
 success: false,
 latencyMs: Date.now() - startedAt,
 httpStatus: status,
 errorMessage: e.message,
 errorKind: detectErrorKind({ status, bodyPreview, message: e.message }),
 })
 return null
 }
}

/**
 * Classify a batch of candidates against a single user query.
 * Returns a ClassifiedCandidate[] in the same order as the input.
 *
 * On DeepSeek failure: returns the candidates with is_match=true and
 * size estimated from regex. Better to show degraded results than nothing.
 */
export async function classifyCandidates(
 userQuery: string,
 candidates: PriceCandidate[],
): Promise<ClassifiedCandidate[]> {
 if (candidates.length === 0) return []

 const canonicalUnit = pickCanonicalUnit(userQuery)
 const llmResults: Map<string, CandidateClassification> = new Map()

 // CACHE: classifications are deterministic given (query, product identity)
 // so we cache them for 7 days. This is what makes per-search marginal cost
 // approach zero after warm-up.
 const cached = await loadCachedClassifications(userQuery, candidates)
 for (const [id, cls] of cached) llmResults.set(id, cls)

 // Only run the LLM on candidates that missed the cache.
 const uncached = candidates.filter((c) => !llmResults.has(c.id))

 // Skip the LLM entirely for tiny candidate sets — regex fallback is fine
 // and we don't want to burn a DeepSeek call for 1-2 candidates.
 if (uncached.length >= 2) {
 const prompt = buildPrompt(userQuery, uncached)
 const llmResponse = await callDeepSeek(prompt)

 if (llmResponse?.results && Array.isArray(llmResponse.results)) {
 const freshResults: Array<{
 candidate: PriceCandidate
 classification: CandidateClassification
 }> = []
 for (const r of llmResponse.results) {
 if (!r?.id) continue
 const candidate = uncached.find((c) => c.id === String(r.id))
 if (!candidate) continue
 const cls: CandidateClassification = {
 id: String(r.id),
 isMatch: Boolean(r.is_match),
 form: (r.form || 'other') as ProductForm,
 estimatedSize: Number(r.estimated_size) || 1,
 estimatedSizeUnit: (r.estimated_size_unit || 'unknown') as SizeUnit,
 isWholesaleQuantity: Boolean(r.is_wholesale),
 hasConditionalPricing: Boolean(r.has_conditional_pricing),
 reasoning: r.reasoning,
 confidence: Number(r.confidence) || 0.5,
 }
 llmResults.set(String(r.id), cls)
 freshResults.push({ candidate, classification: cls })
 }
 // Write the fresh classifications to cache (don't await — best effort)
 saveCachedClassifications(userQuery, freshResults).catch(() => {})
 }
 }

 return candidates.map((c) => {
 let classification = llmResults.get(c.id)

 if (!classification) {
 // Fallback: regex-based, accept all as matches. We can't detect
 // conditional pricing reliably without the LLM, so we conservatively
 // assume the price is straightforward and let downstream display it.
 const fallback = parseSizeFallback(c.productName, c.size)
 classification = {
 id: c.id,
 isMatch: true,
 form: 'other',
 estimatedSize: fallback.value,
 estimatedSizeUnit: fallback.unit,
 isWholesaleQuantity: isWholesaleSlug(c.retailerSlug),
 hasConditionalPricing: Boolean(c.preText || c.saleStory),
 confidence: 0.4,
 reasoning: 'fallback (no LLM classification)',
 }
 } else {
 // Override is_wholesale=true for known wholesale-club retailers even if
 // DeepSeek missed it — they universally sell case quantities.
 if (!classification.isWholesaleQuantity && isWholesaleSlug(c.retailerSlug)) {
 classification = { ...classification, isWholesaleQuantity: true }
 }
 }

 const effectivePrice = c.salePrice ?? c.price
 const canonicalSize = convertToCanonical(
 classification.estimatedSize,
 classification.estimatedSizeUnit,
 canonicalUnit,
 )

 let pricePerUnit: number | null = null
 let pricePerUnitFormatted: string | null = null
 let normalizedUnit: SizeUnit | null = null

 // Don't compute a misleading per-unit price for conditional deals.
 // "$0.79 with $10 purchase" turns into "$0.07/each" without context — that's
 // false advertising as a comparison metric. We let the UI show the raw price
 // plus the deal condition instead.
 if (!classification.hasConditionalPricing) {
 if (canonicalSize && canonicalSize > 0) {
 pricePerUnit = effectivePrice / canonicalSize
 pricePerUnitFormatted = `$${pricePerUnit.toFixed(2)}${formatUnit(canonicalUnit)}`
 normalizedUnit = canonicalUnit
 } else if (
 classification.estimatedSizeUnit !== 'unknown' &&
 classification.estimatedSize > 0
 ) {
 // Couldn't convert to canonical, but we know the unit — show per native unit
 pricePerUnit = effectivePrice / classification.estimatedSize
 pricePerUnitFormatted = `$${pricePerUnit.toFixed(2)}${formatUnit(classification.estimatedSizeUnit)}`
 normalizedUnit = classification.estimatedSizeUnit
 }
 }

 return {
 ...c,
 classification,
 pricePerUnit,
 pricePerUnitFormatted,
 normalizedUnit,
 }
 })
}

/**
 * Reduce a list of classified candidates to the BEST single candidate
 * per retailer (per-retailer cheapest after filtering).
 * This is the input the analyze route uses to build store rows.
 */
export function pickBestPerRetailer(
 classified: ClassifiedCandidate[],
 options?: {
 includeWholesale?: boolean
 minConfidence?: number
 },
): Map<string, ClassifiedCandidate> {
 const minConfidence = options?.minConfidence ?? 0.5
 const includeWholesale = options?.includeWholesale ?? false

 const byRetailer = new Map<string, ClassifiedCandidate>()

 for (const c of classified) {
 if (!c.classification.isMatch) continue
 if (c.classification.confidence < minConfidence) continue
 if (!includeWholesale && c.classification.isWholesaleQuantity) continue

 const key = c.retailerSlug || c.retailer
 const existing = byRetailer.get(key)

 if (!existing) {
 byRetailer.set(key, c)
 continue
 }

 // Within a retailer, prefer the unconditional offer (no "with $X purchase" gotchas)
 // even if it's slightly more expensive. A clean $1.99 beats a hedged $0.79.
 const cIsConditional = c.classification.hasConditionalPricing
 const existingIsConditional = existing.classification.hasConditionalPricing
 if (cIsConditional && !existingIsConditional) continue
 if (!cIsConditional && existingIsConditional) {
 byRetailer.set(key, c)
 continue
 }

 // Both same conditional status — pick cheaper by per-unit (or total fallback).
 const cMetric = c.pricePerUnit ?? c.price
 const existingMetric = existing.pricePerUnit ?? existing.price
 if (cMetric < existingMetric) {
 byRetailer.set(key, c)
 }
 }

 return byRetailer
}
