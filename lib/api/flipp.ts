import axios, { AxiosInstance } from 'axios'
import { logEvent, detectErrorKind } from '@/lib/services/scraper-health'

/**
 * Flipp Client
 *
 * Flipp aggregates weekly grocery circulars from major US chains:
 *   Publix, Wegmans, H-E-B, Meijer, Hy-Vee, Sprouts, Food Lion, Giant Eagle,
 *   ShopRite, Stop & Shop, Giant (Ahold), Winn-Dixie, Aldi, BJ's, Costco,
 *   Sam's Club, Trader Joe's, Whole Foods, Target, Walmart, Kroger family,
 *   and many more — typically 100+ retailers per ZIP.
 *
 * No auth or API key needed — the endpoints are what Flipp's own
 * iOS/Android/web apps call. ZIP-based, returns structured JSON with
 * item name, brand, current_price, valid_from / valid_to, merchant,
 * flyer name, categories, image URL.
 *
 * Coverage is PROMO / WEEKLY-AD ITEMS — typically 200-500 items per
 * retailer per week. This is the data that actually drives shopper
 * switching (loss leaders, BOGOs, sale prices), which makes it the
 * single highest-value zero-cost source for cross-chain comparison.
 *
 * Endpoints (undocumented but stable, used by Flipp.com itself):
 *   GET https://backflipp.wishabi.com/flipp/items/search?q=<term>&postal_code=<zip>&locale=en-us
 *   GET https://backflipp.wishabi.com/flipp/flyers?postal_code=<zip>&locale=en-us
 *   GET https://backflipp.wishabi.com/flipp/flyers/<flyer_id>/flyer_items
 *   GET https://backflipp.wishabi.com/flipp/items/<item_id>
 *
 * Rate limiting: be conservative — Flipp doesn't publish limits.
 * 1 req/sec with jitter is safe; we cache aggressively to stay well under that.
 */

const FLIPP_BASE = 'https://backflipp.wishabi.com/flipp'

const SEARCH_CACHE_TTL = 6 * 60 * 60 * 1000 // 6h — promo prices flip weekly but freshness matters
const FLYER_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h — flyer list per ZIP is stable

interface FlippMerchant {
  id: number
  name: string
  name_identifier: string
  logo_url?: string
}

interface FlippFlyer {
  id: number
  name: string
  merchant: FlippMerchant
  valid_from: string
  valid_to: string
  premium: boolean
  flyer_type_id?: number
  flyer_type_name?: string
  postal_codes?: string[]
}

interface FlippItem {
  id: number
  flyer_id: number
  flyer_item_id?: number
  name: string
  brand?: string
  description?: string
  current_price?: number | string
  pre_price_text?: string
  post_price_text?: string
  sale_story?: string
  sku?: string
  cents_off?: number
  percent_off?: number
  valid_from?: string
  valid_to?: string
  merchant_name?: string
  merchant_logo?: string
  merchant?: FlippMerchant
  flyer_name?: string
  flyer_valid_from?: string
  flyer_valid_to?: string
  category?: string
  categories?: Array<{ id: number; name: string }>
  clipping_image_url?: string
  cutout_image_url?: string
  image_url?: string
}

interface FlippSearchResponse {
  items: FlippItem[]
  ecom_items?: FlippItem[]
  flyers?: FlippFlyer[]
  total_items_count?: number
}

interface FlippFlyerListResponse {
  flyers: FlippFlyer[]
}

interface FlippFlyerItemsResponse {
  items: FlippItem[]
}

export interface NormalizedFlippItem {
  id: string
  name: string
  brand?: string
  description?: string
  retailer: string
  retailerSlug: string
  retailerLogo?: string
  flyerId: string
  flyerName?: string
  price?: number
  salePriceText?: string
  preText?: string
  postText?: string
  centsOff?: number
  percentOff?: number
  validFrom?: string
  validTo?: string
  categories: string[]
  imageUrl?: string
  source: 'flipp'
}

export interface NormalizedFlippFlyer {
  id: string
  name: string
  retailer: string
  retailerSlug: string
  retailerLogo?: string
  validFrom: string
  validTo: string
}

/**
 * Parse a Flipp price string. They sometimes return numeric, sometimes
 * a string like "2.99", "2/$5", or "BOGO". Returns null if non-numeric.
 */
function parsePrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Pull the first dollar amount we can find
  const match = trimmed.match(/(\d+(?:\.\d{1,2})?)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

export class FlippClient {
  private axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: FLIPP_BASE,
      timeout: 15000,
      headers: {
        // Mimic what Flipp's web app sends. No auth required.
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; JulyuPriceBot/1.0)',
      },
    })
  }

  isConfigured(): boolean {
    return true // No key needed
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  private async getCached<T>(
    apiName: string,
    query: string,
    locationId: string | null,
  ): Promise<T | null> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any
      const normalizedQuery = this.normalizeQuery(query)

      let qb = supabase
        .from('api_search_cache')
        .select('results, id, hit_count')
        .eq('api_name', apiName)
        .eq('search_query_normalized', normalizedQuery)
        .gt('expires_at', new Date().toISOString())

      qb = locationId ? qb.eq('location_id', locationId) : qb.is('location_id', null)
      const { data, error } = await qb.single()

      if (error || !data) return null

      supabase
        .from('api_search_cache')
        .update({
          hit_count: (data.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .then(() => {})
        .catch(() => {})

      return data.results as T
    } catch {
      return null
    }
  }

  private async saveCache(
    apiName: string,
    query: string,
    locationId: string | null,
    results: unknown,
    ttlMs: number,
  ): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient() as any
      const normalizedQuery = this.normalizeQuery(query)
      const expiresAt = new Date(Date.now() + ttlMs).toISOString()

      await supabase
        .from('api_search_cache')
        .upsert(
          {
            api_name: apiName,
            search_query: query,
            search_query_normalized: normalizedQuery,
            location_id: locationId,
            results,
            result_count: Array.isArray(results) ? results.length : 0,
            expires_at: expiresAt,
            hit_count: 0,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'api_name,search_query_normalized,location_id' },
        )
    } catch (e) {
      console.error('[Flipp] Cache save error:', e)
    }
  }

  /**
   * Search weekly-ad items across ALL retailers near a ZIP.
   * This is the workhorse method for cross-chain price comparison.
   */
  async searchItems(
    query: string,
    options?: {
      postalCode?: string
      locale?: string
      limit?: number
      skipCache?: boolean
    },
  ): Promise<NormalizedFlippItem[]> {
    const postalCode = options?.postalCode || '10001' // NYC default
    const limit = options?.limit || 50
    const cacheKey = `${query}|${postalCode}`

    if (!options?.skipCache) {
      const cached = await this.getCached<NormalizedFlippItem[]>('flipp', cacheKey, postalCode)
      if (cached) {
        console.log(`[Flipp] Cache HIT for "${query}" @ ${postalCode}`)
        return cached.slice(0, limit)
      }
    }

    const startedAt = Date.now()
    try {
      console.log(`[Flipp] API CALL: "${query}" @ ${postalCode}`)
      const response = await this.axios.get<FlippSearchResponse>('/items/search', {
        params: {
          q: query,
          postal_code: postalCode,
          locale: options?.locale || 'en-us',
        },
      })

      const items = response.data.items || []
      const ecomItems = response.data.ecom_items || []
      const all = [...items, ...ecomItems]

      const normalized = all
        .map((item) => this.normalizeItem(item))
        .filter((item): item is NormalizedFlippItem => item !== null)

      if (normalized.length > 0) {
        await this.saveCache('flipp', cacheKey, postalCode, normalized, SEARCH_CACHE_TTL)
      }

      logEvent({
        source: 'flipp',
        operation: 'search_items',
        success: true,
        latencyMs: Date.now() - startedAt,
        query,
        zip: postalCode,
        resultCount: normalized.length,
        errorKind: normalized.length === 0 ? 'no_results' : undefined,
      })
      return normalized.slice(0, limit)
    } catch (e: any) {
      console.error('[Flipp] Search error:', e.response?.status, e.response?.data || e.message)
      const status = e.response?.status
      const bodyPreview =
        typeof e.response?.data === 'string'
          ? e.response.data
          : JSON.stringify(e.response?.data || {}).substring(0, 200)
      logEvent({
        source: 'flipp',
        operation: 'search_items',
        success: false,
        latencyMs: Date.now() - startedAt,
        httpStatus: status,
        errorMessage: e.message,
        errorKind: detectErrorKind({ status, bodyPreview, message: e.message }),
        query,
        zip: postalCode,
      })
      return []
    }
  }

  /**
   * List all flyers available near a ZIP. Useful to enumerate which
   * retailers are reachable from a given location.
   */
  async listFlyers(postalCode: string, locale = 'en-us'): Promise<NormalizedFlippFlyer[]> {
    const cached = await this.getCached<NormalizedFlippFlyer[]>('flipp-flyers', postalCode, postalCode)
    if (cached) {
      console.log(`[Flipp] Cache HIT flyers @ ${postalCode}`)
      return cached
    }

    try {
      console.log(`[Flipp] API CALL flyers @ ${postalCode}`)
      const response = await this.axios.get<FlippFlyerListResponse>('/flyers', {
        params: { postal_code: postalCode, locale },
      })

      const flyers = (response.data.flyers || []).map((f) => this.normalizeFlyer(f))
      if (flyers.length > 0) {
        await this.saveCache('flipp-flyers', postalCode, postalCode, flyers, FLYER_CACHE_TTL)
      }
      return flyers
    } catch (e: any) {
      console.error('[Flipp] List flyers error:', e.response?.status, e.message)
      return []
    }
  }

  /**
   * Fetch every item in a specific flyer. Use this after listFlyers to
   * bulk-import a retailer's entire weekly ad.
   */
  async getFlyerItems(flyerId: string | number): Promise<NormalizedFlippItem[]> {
    const cacheKey = `flyer:${flyerId}`
    const cached = await this.getCached<NormalizedFlippItem[]>('flipp-flyer-items', cacheKey, null)
    if (cached) return cached

    try {
      const response = await this.axios.get<FlippFlyerItemsResponse>(
        `/flyers/${flyerId}/flyer_items`,
      )
      const items = (response.data.items || [])
        .map((it) => this.normalizeItem(it))
        .filter((it): it is NormalizedFlippItem => it !== null)

      if (items.length > 0) {
        await this.saveCache('flipp-flyer-items', cacheKey, null, items, FLYER_CACHE_TTL)
      }
      return items
    } catch (e: any) {
      console.error('[Flipp] Flyer items error:', e.response?.status, e.message)
      return []
    }
  }

  private normalizeItem(item: FlippItem): NormalizedFlippItem | null {
    if (!item || !item.name) return null

    const merchant = item.merchant
    const retailer = item.merchant_name || merchant?.name || 'Unknown'
    const retailerSlug = merchant?.name_identifier || retailer.toLowerCase().replace(/\s+/g, '-')

    const price = parsePrice(item.current_price)
    const imageUrl =
      item.clipping_image_url || item.cutout_image_url || item.image_url || undefined

    const categories: string[] = []
    if (item.category) categories.push(item.category)
    if (item.categories) {
      for (const c of item.categories) {
        if (c.name && !categories.includes(c.name)) categories.push(c.name)
      }
    }

    return {
      id: String(item.id),
      name: item.name,
      brand: item.brand,
      description: item.description,
      retailer,
      retailerSlug,
      retailerLogo: item.merchant_logo || merchant?.logo_url,
      flyerId: String(item.flyer_id),
      flyerName: item.flyer_name,
      price: price ?? undefined,
      salePriceText:
        typeof item.current_price === 'string' ? item.current_price : undefined,
      preText: item.pre_price_text,
      postText: item.post_price_text,
      centsOff: item.cents_off,
      percentOff: item.percent_off,
      validFrom: item.valid_from || item.flyer_valid_from,
      validTo: item.valid_to || item.flyer_valid_to,
      categories,
      imageUrl,
      source: 'flipp',
    }
  }

  private normalizeFlyer(flyer: FlippFlyer): NormalizedFlippFlyer {
    return {
      id: String(flyer.id),
      name: flyer.name,
      retailer: flyer.merchant.name,
      retailerSlug: flyer.merchant.name_identifier,
      retailerLogo: flyer.merchant.logo_url,
      validFrom: flyer.valid_from,
      validTo: flyer.valid_to,
    }
  }
}

export const flippClient = new FlippClient()

/**
 * Helper: search a term across ALL chains via Flipp and insert results
 * into the prices/products/stores tables for cross-chain comparison.
 *
 * Note: Flipp items aren't UPC-tagged, so product matching is name-based.
 * Run results through the existing product-matcher before insertion in
 * production — for now this writes one product row per unique (name, brand).
 */
export async function searchAndImportFlippItems(
  supabase: any,
  query: string,
  postalCode: string,
): Promise<{ imported: number; items: NormalizedFlippItem[] }> {
  try {
    const items = await flippClient.searchItems(query, { postalCode, limit: 100 })
    let imported = 0

    for (const item of items) {
      if (item.price === undefined) continue

      // Upsert retailer as a store row keyed on retailerSlug.
      // We use slug as store_number so one row per retailer/ZIP combo.
      const storeNumber = `flipp:${item.retailerSlug}:${postalCode}`
      let storeId: string | null = null

      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('store_number', storeNumber)
        .maybeSingle()

      if (existingStore) {
        storeId = existingStore.id
      } else {
        const { data: newStore } = await supabase
          .from('stores')
          .insert({
            retailer: item.retailerSlug,
            store_number: storeNumber,
            name: item.retailer,
            zip: postalCode,
          })
          .select('id')
          .single()
        storeId = newStore?.id || null
      }

      if (!storeId) continue

      // Upsert product by (name + brand) — Flipp doesn't give UPC.
      const productName = item.name
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .ilike('name', productName)
        .eq('brand', item.brand || 'Unknown')
        .maybeSingle()

      let productId = existingProduct?.id
      if (!productId) {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: productName,
            brand: item.brand || 'Unknown',
            category: item.categories[0],
            image_url: item.imageUrl,
            attributes: {
              flipp_id: item.id,
              source: 'flipp',
            },
          })
          .select('id')
          .single()
        productId = newProduct?.id
      }

      if (!productId) continue

      await supabase.from('prices').insert({
        product_id: productId,
        store_id: storeId,
        price: item.price,
        sale_price: item.price, // Flipp prices are sale/promo prices
        source: 'flipp',
        confidence: 0.85,
        expires_at: item.validTo || null,
      })
      imported++
    }

    return { imported, items }
  } catch (e) {
    console.error('[Flipp] Import error:', e)
    return { imported: 0, items: [] }
  }
}
