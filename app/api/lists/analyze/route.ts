import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'
import { krogerClient, NormalizedKrogerProduct } from '@/lib/api/kroger'
import { serpApiWalmartClient, NormalizedWalmartProduct } from '@/lib/api/serpapi-walmart'
import { flippClient, NormalizedFlippItem } from '@/lib/api/flipp'
import { targetClient, NormalizedTargetProduct } from '@/lib/api/target'
import {
 classifyCandidates,
 pickBestPerRetailer,
 PriceCandidate,
 ClassifiedCandidate,
} from '@/lib/services/product-equivalence'
import { searchPrices as offSearchPrices } from '@/lib/api/open-food-facts-prices'
import { compareShoppingList, getAggregatedPrices } from '@/lib/services/price-aggregator'
import { geocodeLocation } from '@/lib/services/geocoding'
import {
 generateListHash,
 generateLocationContext,
 getCachedComparison,
 cacheComparison,
} from '@/lib/services/comparison-cache'
import {
 findLocalProductMatches,
 saveProductsToCatalog,
} from '@/lib/services/product-matcher'
import {
 logComparisonTrainingBatch,
 type ComparisonTrainingPair,
} from '@/lib/ml/comparison-training'

export const dynamic = 'force-dynamic'

/**
 * Search for nearby bodega stores with inventory
 */
async function searchBodegaStores(
 supabase: any,
 userLat: number,
 userLon: number,
 radiusMiles: number = 10
): Promise<any[]> {
 try {
 // Find active, verified bodega stores
 const { data: stores, error: storesError } = await supabase
 .from('bodega_stores')
 .select(`
 *,
 store_owner:store_owners(business_name)
 `)
 .eq('is_active', true)
 .eq('verified', true)
 .not('latitude', 'is', null)
 .not('longitude', 'is', null)

 if (storesError || !stores || stores.length === 0) {
 console.log('[searchBodegaStores] No bodega stores found:', storesError?.message || 'empty result')
 return []
 }

 // Calculate distances and filter by radius
 const storesWithDistance = stores
 .map((store: any) => {
 if (!store.latitude || !store.longitude) return null

 // Haversine formula
 const R = 3959 // Earth's radius in miles
 const dLat = (store.latitude - userLat) * Math.PI / 180
 const dLon = (store.longitude - userLon) * Math.PI / 180
 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos(userLat * Math.PI / 180) * Math.cos(store.latitude * Math.PI / 180) *
 Math.sin(dLon / 2) * Math.sin(dLon / 2)
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
 const distance = R * c

 return {
 ...store,
 distance: parseFloat(distance.toFixed(2))
 }
 })
 .filter((store: any) => store !== null && store.distance <= radiusMiles)
 .sort((a: any, b: any) => a.distance - b.distance)

 return storesWithDistance
 } catch (error: any) {
 console.error('[searchBodegaStores] Error:', error.message)
 return []
 }
}

/**
 * Search bodega inventory for items
 */
async function searchBodegaInventory(
 supabase: any,
 storeIds: string[],
 items: string[]
): Promise<Map<string, any[]>> {
 const inventoryByStore = new Map<string, any[]>()

 if (storeIds.length === 0) return inventoryByStore

 try {
 // Get all inventory for these stores
 const { data: inventory, error } = await supabase
 .from('bodega_inventory')
 .select(`
 *,
 product:products(name, brand, size, image_url)
 `)
 .in('bodega_store_id', storeIds)
 .eq('in_stock', true)
 .gt('stock_quantity', 0)

 if (error || !inventory) {
 console.error('[searchBodegaInventory] Error:', error?.message)
 return inventoryByStore
 }

 // For each item, find matches in inventory
 for (const storeId of storeIds) {
 const storeInventory = inventory.filter((inv: any) => inv.bodega_store_id === storeId)
 const itemMatches: any[] = []

 for (const item of items) {
 const searchTerms = item.toLowerCase().split(' ')

 // Find best match for this item
 const match = storeInventory.find((inv: any) => {
 const itemName = (inv.custom_name || inv.product?.name || '').toLowerCase()
 const itemBrand = (inv.custom_brand || inv.product?.brand || '').toLowerCase()
 const searchText = `${itemName} ${itemBrand}`

 return searchTerms.some((term: string) => searchText.includes(term))
 })

 itemMatches.push({
 userInput: item,
 product: match ? {
 id: match.id,
 name: match.custom_name || match.product?.name || 'Unknown',
 brand: match.custom_brand || match.product?.brand || null,
 size: match.custom_size || match.product?.size || null,
 imageUrl: match.custom_image_url || match.product?.image_url || null,
 price: { regular: parseFloat(match.sale_price) }
 } : null,
 price: match ? parseFloat(match.sale_price) : null
 })
 }

 inventoryByStore.set(storeId, itemMatches)
 }

 return inventoryByStore
 } catch (error: any) {
 console.error('[searchBodegaInventory] Error:', error.message)
 return inventoryByStore
 }
}

/**
 * Save comparison to database and update user savings
 */
async function saveComparison(
 supabase: any,
 userId: string,
 items: string[],
 result: {
 bestOption: { store: { name: string }; total: number } | null
 alternatives?: { total: number }[]
 summary: { totalItems: number; itemsFound: number; estimatedTotal: number }
 }
) {
 try {
 // Create a temporary shopping list for this comparison
 const { data: list, error: listError } = await supabase
 .from('shopping_lists')
 .insert({
 user_id: userId,
 name: `Quick Compare - ${new Date().toLocaleDateString()}`,
 })
 .select('id')
 .single()

 if (listError || !list) {
 console.error('[SaveComparison] Failed to create list:', listError)
 return
 }

 // Insert list items
 const listItems = items.map(item => ({
 list_id: list.id,
 user_input: item,
 }))

 await supabase.from('list_items').insert(listItems)

 // Save the comparison
 const { error: compError } = await supabase.from('comparisons').insert({
 list_id: list.id,
 user_id: userId,
 results: result,
 best_option: result.bestOption,
 total_savings: (() => {
 const bestTotal = result.bestOption?.total || 0
 const altTotals = result.alternatives?.map(a => a.total) || []

 // Smart savings calculation: real comparison OR industry baseline
 if (altTotals.length > 0) {
 // Check if we have different prices (real multi-store comparison)
 const uniquePrices = new Set(altTotals.map(t => t.toFixed(2)))
 const bestPriceStr = bestTotal.toFixed(2)

 // If stores have different prices, use real comparison
 if (uniquePrices.size > 1 || !uniquePrices.has(bestPriceStr)) {
 const maxTotal = Math.max(...altTotals)
 console.log('[SaveComparison] Real multi-store comparison:', { bestTotal, maxTotal, savings: maxTotal - bestTotal })
 return Math.max(0, maxTotal - bestTotal)
 }
 }

 // All stores have same prices OR only one store - use industry baseline
 // Industry research: average grocery markup is 15-18% above discount stores
 const industryAverage = bestTotal * 1.18
 const baselineSavings = Math.max(0, industryAverage - bestTotal)
 console.log('[SaveComparison] Using industry baseline (18%):', { bestTotal, industryAverage, baselineSavings })
 return baselineSavings
 })()
 })

 if (compError) {
 console.error('[SaveComparison] Failed to save comparison:', compError)
 return
 }

 // Update user savings for this month
 const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

 // Get existing savings record for this month
 const { data: existingSavings } = await supabase
 .from('user_savings')
 .select('*')
 .eq('user_id', userId)
 .eq('month', currentMonth)
 .single()

 if (existingSavings) {
 // Update existing record
 await supabase
 .from('user_savings')
 .update({
 total_spent: (existingSavings.total_spent || 0) + (result.summary?.estimatedTotal || 0),
 trips_count: (existingSavings.trips_count || 0) + 1,
 avg_savings_per_trip: existingSavings.total_saved
 ? (existingSavings.total_saved / ((existingSavings.trips_count || 0) + 1))
 : 0,
 })
 .eq('id', existingSavings.id)
 } else {
 // Create new record for this month
 await supabase.from('user_savings').insert({
 user_id: userId,
 month: currentMonth,
 total_spent: result.summary?.estimatedTotal || 0,
 total_saved: 0,
 trips_count: 1,
 avg_savings_per_trip: 0,
 })
 }

 console.log('[SaveComparison] Successfully saved comparison and updated savings')
 } catch (error) {
 console.error('[SaveComparison] Error:', error)
 }
}

interface StoreResult {
 storeId: string
 storeName: string
 retailer: string
 distance?: string | null
 address?: string
 items: Array<{
 userInput: string
 product: NormalizedKrogerProduct | NormalizedWalmartProduct | null
 price: number | null
 }>
 total: number
 itemsFound: number
 itemsMissing: number
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
 const R = 3959 // Earth's radius in miles
 const dLat = (lat2 - lat1) * Math.PI / 180
 const dLon = (lon2 - lon1) * Math.PI / 180
 const a =
 Math.sin(dLat/2) * Math.sin(dLat/2) +
 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
 Math.sin(dLon/2) * Math.sin(dLon/2)
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
 return R * c
}

/**
 * Get approximate coordinates for a US zip code
 * Using a simple estimation - in production would use a geocoding API
 */
// Removed hardcoded Cincinnati-only geocoding function
// Now using Positionstack geocoding service for all locations

export async function POST(request: NextRequest) {
 try {
 const supabase = await createServerClient()
 const { data: { user }, error: authError } = await supabase.auth.getUser()

 // In test mode, allow requests even if auth fails
 const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
 process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

 const firebaseUserId = request.headers.get('x-user-id')
 const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

 if (!userId) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const body = await request.json()
 const { items, listId, zipCode, address } = body

 // If listId is provided, compare existing list
 if (listId) {
 console.log('[ListAnalyze] Comparing existing list:', listId)
 const comparison = await compareShoppingList(listId)

 return NextResponse.json({
 success: true,
 comparison,
 dataSource: 'aggregated',
 })
 }

 // Otherwise, analyze items directly
 if (!items || !Array.isArray(items) || items.length === 0) {
 return NextResponse.json({ error: 'Invalid items - provide items array or listId' }, { status: 400 })
 }

 console.log('[ListAnalyze] Analyzing items:', items)

 // PHASE 1: Check comparison cache for identical list searches
 const listHash = generateListHash(items)
 const locationContext = generateLocationContext(zipCode)
 console.log(`[ListAnalyze] List hash: ${listHash.substring(0, 8)}..., location: ${locationContext || 'none'}`)

 const cachedResult = await getCachedComparison(listHash, locationContext)
 if (cachedResult) {
 console.log('[ListAnalyze] CACHE HIT - returning cached comparison (0 API calls)')
 return NextResponse.json({
 ...cachedResult,
 cached: true,
 cacheHit: true,
 })
 }
 console.log('[ListAnalyze] Cache miss - proceeding with API calls')

 // Check if Kroger API is available
 const krogerAvailable = await krogerClient.isConfiguredAsync()
 console.log('[ListAnalyze] Kroger API available:', krogerAvailable)

 if (krogerAvailable) {
 // Use Kroger API for real-time prices
 return await analyzeWithKroger(items, zipCode, address, supabase, userId, listHash, locationContext)
 }

 // Fallback to database-based analysis
 return await analyzeWithDatabase(items, supabase, userId)
 } catch (error: any) {
 console.error('[ListAnalyze] Error:', error)
 return NextResponse.json(
 { error: error.message || 'Failed to analyze list' },
 { status: 500 }
 )
 }
}

/**
 * Analyze shopping list using Kroger API for real-time prices
 */
async function analyzeWithKroger(
 items: string[],
 zipCode: string | undefined,
 address: string | undefined,
 supabase: any,
 userId: string,
 listHash?: string,
 locationContext?: string | null
) {
 console.log('[ListAnalyze] Using Kroger API with zip:', zipCode, 'address:', address)

 // Step 1: Geocode the location (address first, then zip)
 let coordinates: { lat: number; lng: number } | null = null
 let searchZip: string | undefined = zipCode

 try {
 const geocodeResult = await geocodeLocation(address, zipCode)
 if (geocodeResult) {
 coordinates = {
 lat: geocodeResult.latitude,
 lng: geocodeResult.longitude
 }
 console.log('[ListAnalyze] Geocoded to:', coordinates, 'source:', geocodeResult.source)
 } else if (!zipCode && !address) {
 // No location provided at all - return error
 return NextResponse.json({
 success: false,
 error: 'Please provide either an address or zip code to find nearby stores.',
 }, { status: 400 })
 } else if (!zipCode && address) {
 // Address provided but geocoding failed (probably no API key) - extract zip from address
 const zipMatch = address.match(/\b\d{5}\b/)
 if (zipMatch) {
 searchZip = zipMatch[0]
 console.log('[ListAnalyze] Extracted zip from address:', searchZip)
 } else {
 console.log('[ListAnalyze] Geocoding failed and no zip code - will search without distance')
 }
 }
 } catch (geocodeError: any) {
 console.error('[ListAnalyze] Geocoding failed:', geocodeError.message)
 // Extract zip from address if possible
 if (!zipCode && address) {
 const zipMatch = address.match(/\b\d{5}\b/)
 if (zipMatch) {
 searchZip = zipMatch[0]
 console.log('[ListAnalyze] Extracted zip from address after error:', searchZip)
 }
 }
 // Continue even if geocoding fails - just won't have accurate distances
 }

 // Step 2: Find nearby Kroger stores (prefer coordinates over zip)
 let stores: any[] = []
 try {
 if (coordinates) {
 // Use coordinate-based search (more accurate)
 stores = await krogerClient.searchLocations({
 lat: coordinates.lat,
 lng: coordinates.lng,
 limit: 5
 })
 console.log('[ListAnalyze] Found', stores.length, 'Kroger stores using coordinates')
 } else if (searchZip) {
 // Fallback to zip code search
 stores = await krogerClient.searchLocations({
 zipCode: searchZip,
 limit: 5
 })
 console.log('[ListAnalyze] Found', stores.length, 'Kroger stores using zip code')
 } else {
 // No coordinates or zip - return helpful error
 return NextResponse.json({
 success: false,
 error: 'Unable to determine location. Please provide a zip code or a complete address with zip code.',
 }, { status: 400 })
 }
 } catch (storeError: any) {
 console.error('[ListAnalyze] Failed to find stores:', storeError.message)
 return NextResponse.json({
 success: false,
 error: 'Failed to find nearby stores. Please check your location.',
 }, { status: 400 })
 }

 // Also search bodega stores
 let bodegaStores: any[] = []
 if (coordinates) {
 bodegaStores = await searchBodegaStores(supabase, coordinates.lat, coordinates.lng, 10)
 console.log('[ListAnalyze] Found', bodegaStores.length, 'bodega stores')
 }

 // Note: we no longer bail here if Kroger/bodega are empty —
 // Flipp + Target can return results for ZIPs outside Kroger's footprint.
 // The final bail happens at the end if ALL sources returned nothing.

 // PHASE 2: Check local product catalog with fuzzy matching
 // This reduces API calls by matching common items locally
 const { matched: localMatches, unmatched: itemsNeedingApi, stats: matchStats } = await findLocalProductMatches(items)
 console.log(`[ListAnalyze] Local catalog: ${matchStats.matchedCount} matched, ${matchStats.unmatchedCount} need API (avg confidence: ${matchStats.avgConfidence})`)

 // EQUIVALENCE ENGINE: pool every candidate from every source per user item,
 // then classify the whole pool with DeepSeek so we filter out non-equivalent
 // products (snack pouches, wholesale cases, frozen-cooked, etc.) and compute
 // a per-unit price for honest ranking.
 const candidatePoolByItem = new Map<string, PriceCandidate[]>()
 for (const it of items) candidatePoolByItem.set(it, [])

 // Seed pool with local catalog matches (they already passed the matcher's
 // confidence threshold AND have a real price attached).
 for (const m of localMatches) {
 const pool = candidatePoolByItem.get(m.userInput)
 if (!pool) continue
 pool.push({
 id: `local-${m.product.id}`,
 source: 'database',
 retailer: m.storeName || 'Database',
 retailerSlug: (m.storeName || 'database').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
 productName: m.product.name,
 brand: m.product.brand || undefined,
 size: m.product.size || undefined,
 price: m.price || 0,
 salePrice: m.salePrice || undefined,
 imageUrl: m.product.imageUrl || undefined,
 })
 }

 // Step 2: Search for each item at Kroger stores (if available)
 // Only search for items NOT found in local catalog
 const primaryStore = stores[0]
 const productResults: Array<{
 userInput: string
 krogerProduct: NormalizedKrogerProduct | null
 price: number | null
 fromLocalCatalog?: boolean
 }> = []

 // Add locally matched items first (no API call needed!)
 for (const match of localMatches) {
 productResults.push({
 userInput: match.userInput,
 krogerProduct: {
 id: match.product.id,
 upc: match.product.upc || '',
 name: match.product.name,
 brand: match.product.brand || '',
 description: '',
 categories: [],
 imageUrl: match.product.imageUrl || undefined,
 price: match.price ? {
 regular: match.price,
 sale: match.salePrice || undefined,
 } : undefined,
 availability: { inStore: true, delivery: false, pickup: false },
 },
 price: match.salePrice || match.price,
 fromLocalCatalog: true,
 })
 console.log(`[ListAnalyze] LOCAL MATCH: "${match.userInput}" "${match.product.name}" ($${match.price || 'no price'})`)
 }

 // Only search Kroger if we have Kroger stores AND items needing API
 if (primaryStore && itemsNeedingApi.length > 0) {
 console.log(`[ListAnalyze] Searching Kroger for ${itemsNeedingApi.length} items (${localMatches.length} skipped via local catalog)`)
 for (const item of itemsNeedingApi) {
 try {
 console.log(`[ListAnalyze] Searching Kroger for: ${item}`)
 // Bumped to 5 candidates so the equivalence classifier has choices —
 // the first match is often wrong (e.g. a snack-pack on a "chicken breast" query).
 const products = await krogerClient.searchProducts(item, {
 locationId: primaryStore.id,
 limit: 5,
 })

 if (products.length > 0) {
 // Keep the legacy first-result behavior for downstream training-data hooks.
 const product = products[0]
 productResults.push({
 userInput: item,
 krogerProduct: product,
 price: product.price?.sale || product.price?.regular || null,
 })
 // Push every Kroger candidate into the equivalence pool.
 const pool = candidatePoolByItem.get(item)
 if (pool) {
 for (const p of products) {
 const regular = p.price?.regular
 const sale = p.price?.sale
 const effective = sale ?? regular
 if (effective === undefined) continue
 pool.push({
 id: `kroger-${p.id}`,
 source: 'kroger',
 retailer: 'Kroger',
 retailerSlug: 'kroger',
 productName: p.name,
 brand: p.brand,
 size: p.size,
 price: regular ?? effective,
 salePrice: sale,
 imageUrl: p.imageUrl,
 raw: p,
 })
 }
 }
 console.log(`[ListAnalyze] Found: ${product.name} - $${product.price?.regular}`)
 } else {
 productResults.push({
 userInput: item,
 krogerProduct: null,
 price: null,
 })
 console.log(`[ListAnalyze] No results for: ${item}`)
 }
 } catch (searchError: any) {
 console.error(`[ListAnalyze] Search failed for ${item}:`, searchError.message)
 productResults.push({
 userInput: item,
 krogerProduct: null,
 price: null,
 })
 }
 }
 } else if (!primaryStore) {
 // No Kroger stores - add empty results for unmatched items only
 for (const item of itemsNeedingApi) {
 productResults.push({
 userInput: item,
 krogerProduct: null,
 price: null,
 })
 }
 } else {
 console.log('[ListAnalyze] All items matched from local catalog - no Kroger API calls needed!')
 }

 // Step 3: Search bodega inventory
 const bodegaStoreIds = bodegaStores.map((s: any) => s.id)
 const bodegaInventory = await searchBodegaInventory(supabase, bodegaStoreIds, items)

 // Step 3.5: Search Walmart via SerpApi (if configured)
 // Only search for items NOT found in local catalog (same optimization as Kroger)
 const walmartResults: Array<{
 userInput: string
 walmartProduct: NormalizedWalmartProduct | null
 price: number | null
 fromLocalCatalog?: boolean
 }> = []

 // Add locally matched items first (no Walmart API call needed!)
 for (const match of localMatches) {
 walmartResults.push({
 userInput: match.userInput,
 walmartProduct: {
 id: match.product.id,
 upc: match.product.upc || undefined,
 name: match.product.name,
 brand: match.product.brand || undefined,
 imageUrl: match.product.imageUrl || undefined,
 price: match.price ? {
 regular: match.price,
 sale: match.salePrice || undefined,
 } : undefined,
 productUrl: '',
 availability: { inStore: true, delivery: false, pickup: false },
 },
 price: match.salePrice || match.price,
 fromLocalCatalog: true,
 })
 }

 const walmartConfigured = await serpApiWalmartClient.isConfiguredAsync()
 if (walmartConfigured && itemsNeedingApi.length > 0) {
 console.log(`[ListAnalyze] Searching Walmart for ${itemsNeedingApi.length} items (${localMatches.length} skipped via local catalog)`)
 for (const item of itemsNeedingApi) {
 try {
 const walmartProducts = await serpApiWalmartClient.searchProducts(item, { limit: 5 })
 if (walmartProducts.length > 0) {
 const product = walmartProducts[0]
 walmartResults.push({
 userInput: item,
 walmartProduct: product,
 price: product.price?.sale || product.price?.regular || null,
 })
 // Pool every Walmart candidate
 const pool = candidatePoolByItem.get(item)
 if (pool) {
 for (const p of walmartProducts) {
 const regular = p.price?.regular
 const sale = p.price?.sale
 const effective = sale ?? regular
 if (effective === undefined) continue
 pool.push({
 id: `walmart-${p.id}`,
 source: 'walmart',
 retailer: 'Walmart',
 retailerSlug: 'walmart',
 productName: p.name,
 brand: p.brand,
 price: regular ?? effective,
 salePrice: sale,
 imageUrl: p.imageUrl,
 raw: p,
 })
 }
 }
 console.log(`[ListAnalyze] Walmart found: ${product.name} - $${product.price?.regular}`)
 } else {
 walmartResults.push({
 userInput: item,
 walmartProduct: null,
 price: null,
 })
 }
 } catch (walmartError: any) {
 console.error(`[ListAnalyze] Walmart search failed for ${item}:`, walmartError.message)
 walmartResults.push({
 userInput: item,
 walmartProduct: null,
 price: null,
 })
 }
 }
 console.log(`[ListAnalyze] Walmart search complete: ${walmartResults.filter(r => r.price).length}/${items.length} items found (${localMatches.length} from local catalog)`)
 } else if (walmartConfigured) {
 console.log('[ListAnalyze] All items matched from local catalog - no Walmart API calls needed!')
 } else {
 console.log('[ListAnalyze] Walmart/SerpApi not configured, skipping')
 }

 // Step 3.6: Search Flipp — cross-chain weekly-ad aggregator
 // Flipp returns items from 50-100+ retailers in a single query, keyed by ZIP.
 // We push every priced item into the candidate pool. Equivalence classification
 // happens later — there's no point picking "cheapest" per retailer here because
 // the cheapest match might be a non-equivalent product (snack pouch, deli cut).
 const flippZip = searchZip
 let flippTotalHits = 0
 if (flippZip) {
 console.log(`[ListAnalyze] Searching Flipp @ ${flippZip} for ${itemsNeedingApi.length} items`)
 for (const item of itemsNeedingApi) {
 try {
 const flippItems = await flippClient.searchItems(item, {
 postalCode: flippZip,
 limit: 30,
 })
 const pool = candidatePoolByItem.get(item)
 if (!pool) continue
 for (const fi of flippItems) {
 if (fi.price === undefined) continue
 // Drop "Unknown" retailer rows — these are Flipp items where the merchant
 // name didn't come back and they pollute the comparison.
 if (!fi.retailer || fi.retailer === 'Unknown' || fi.retailer === 'unknown') continue
 pool.push({
 id: `flipp-${fi.id}`,
 source: 'flipp',
 retailer: fi.retailer,
 retailerSlug: fi.retailerSlug,
 productName: fi.name,
 brand: fi.brand,
 price: fi.price,
 salePrice: fi.price, // Flipp prices ARE promo prices
 imageUrl: fi.imageUrl,
 preText: fi.preText,
 postText: fi.postText,
 saleStory: fi.salePriceText,
 validTo: fi.validTo,
 raw: fi,
 })
 flippTotalHits++
 }
 } catch (e: any) {
 console.error(`[ListAnalyze] Flipp search failed for "${item}":`, e.message)
 }
 }
 console.log(`[ListAnalyze] Flipp pushed ${flippTotalHits} candidates to pool`)
 }

 // Step 3.7: Search Target — single retailer, accurate store-level pricing
 let targetStoreInfo:
 | { id: string; name: string; city?: string; state?: string; lat?: number; lng?: number }
 | null = null
 if (flippZip && itemsNeedingApi.length > 0) {
 try {
 const targetStores = await targetClient.searchStores(flippZip, 1)
 const targetStoreId = targetStores[0]?.id
 if (targetStores[0]) {
 targetStoreInfo = {
 id: targetStores[0].id,
 name: targetStores[0].name,
 city: targetStores[0].city,
 state: targetStores[0].state,
 lat: targetStores[0].lat,
 lng: targetStores[0].lng,
 }
 }

 console.log(
 `[ListAnalyze] Searching Target @ store ${targetStoreId || '(default)'} for ${itemsNeedingApi.length} items`,
 )
 for (const item of itemsNeedingApi) {
 try {
 const products = await targetClient.searchProducts(item, {
 storeId: targetStoreId,
 zip: flippZip,
 limit: 5,
 })
 const pool = candidatePoolByItem.get(item)
 if (!pool) continue
 for (const p of products) {
 const regular = p.price?.regular
 const sale = p.price?.sale
 const effective = sale ?? regular
 if (effective === undefined) continue
 pool.push({
 id: `target-${p.id}`,
 source: 'target',
 retailer: 'Target',
 retailerSlug: 'target',
 productName: p.name,
 brand: p.brand,
 price: regular ?? effective,
 salePrice: sale,
 imageUrl: p.imageUrl,
 raw: p,
 })
 }
 } catch (e: any) {
 console.error(`[ListAnalyze] Target search failed for "${item}":`, e.message)
 }
 }
 } catch (e: any) {
 console.error('[ListAnalyze] Target store lookup failed:', e.message)
 }
 }

 // Step 3.8: Open Food Facts Prices fallback — community-reported prices
 // Only invoked for items where the primary sources gave us thin coverage
 // (< 3 candidates) so we don't burn API calls when we already have enough.
 // OFF returns crowdsourced prices without specific retailer info, so we
 // aggregate them into a single "Community Reports" entry per item.
 const thinItems = items.filter((it) => (candidatePoolByItem.get(it)?.length || 0) < 3)
 if (thinItems.length > 0) {
 console.log(`[ListAnalyze] Calling OFF Prices for ${thinItems.length} thin-coverage items`)
 await Promise.all(
 thinItems.map(async (item) => {
 try {
 const response = await offSearchPrices({ product_name: item, size: 8 })
 const priced = (response.items || [])
 .map((p) => Number(p.price))
 .filter((n) => Number.isFinite(n) && n > 0)
 if (priced.length === 0) return

 // Use median to reject outliers (one user logging $99 for milk shouldn't win)
 priced.sort((a, b) => a - b)
 const median = priced[Math.floor(priced.length / 2)]
 const pool = candidatePoolByItem.get(item)
 if (!pool) return

 pool.push({
 id: `off-${item.replace(/[^a-z0-9]/gi, '-')}`,
 source: 'database', // surfaces as "User-Reported" in the UI
 retailer: 'Community Reports',
 retailerSlug: 'community-reports',
 productName: item,
 brand: 'Various',
 price: median,
 // No size info on OFF prices reliably — let the classifier infer
 // from the user query (e.g. "milk" fl-oz canonical still useful
 // for the "is this product?" question even without a per-unit number).
 raw: { offResults: response.items.slice(0, 5) },
 })
 } catch (e: any) {
 // OFF logging happens inside searchPrices; nothing more to do here
 console.warn(`[ListAnalyze] OFF lookup failed for "${item}":`, e.message)
 }
 }),
 )
 }

 // EQUIVALENCE CLASSIFICATION
 // Classify every item's candidate pool in parallel. DeepSeek decides which
 // candidates are real equivalents, what form they are, and their size.
 console.log(`[ListAnalyze] Classifying candidates for ${items.length} items`)
 const classifiedByItem = new Map<string, ClassifiedCandidate[]>()
 await Promise.all(
 items.map(async (it) => {
 const pool = candidatePoolByItem.get(it) || []
 if (pool.length === 0) {
 classifiedByItem.set(it, [])
 return
 }
 const classified = await classifyCandidates(it, pool)
 classifiedByItem.set(it, classified)
 const matches = classified.filter((c) => c.classification.isMatch).length
 console.log(
 `[ListAnalyze] "${it}": ${pool.length} candidates ${matches} matches after classification`,
 )
 }),
 )

 // Reduce to best-classified-candidate per (retailer, item).
 // includeWholesale defaults to false — wholesale-club case prices distort
 // comparisons. We could expose a user toggle later.
 type ItemMap = Map<string, ClassifiedCandidate>
 const retailerToItems = new Map<string, ItemMap>()
 const retailerMeta = new Map<
 string,
 { name: string; source: ClassifiedCandidate['source']; logo?: string }
 >()
 for (const it of items) {
 const classified = classifiedByItem.get(it) || []
 const bestByRetailer = pickBestPerRetailer(classified, { includeWholesale: false })
 for (const [slug, candidate] of bestByRetailer) {
 let map = retailerToItems.get(slug)
 if (!map) {
 map = new Map()
 retailerToItems.set(slug, map)
 }
 map.set(it, candidate)
 if (!retailerMeta.has(slug)) {
 retailerMeta.set(slug, {
 name: candidate.retailer,
 source: candidate.source,
 })
 }
 }
 }
 console.log(
 `[ListAnalyze] After classification: ${retailerToItems.size} retailers have at least one matching item`,
 )

 // Step 5: Build store results FROM CLASSIFIED DATA.
 // This block replaces the old per-source builders. Everything that came back
 // from Kroger / Walmart / Target / Flipp has been pooled, classified by the
 // equivalence engine, and reduced to a best-per-retailer-per-item map. We
 // just turn that map into store rows.
 const userCoords = coordinates
 console.log('[ListAnalyze] User coordinates:', userCoords)

 // Helper: turn one classified candidate into the item-row shape the frontend expects.
 const candidateToRow = (userInput: string, c: ClassifiedCandidate | undefined) => {
 if (!c) {
 return {
 userInput,
 product: null,
 price: null,
 pricePerUnit: null,
 pricePerUnitFormatted: null,
 sizeLabel: null,
 dealCondition: null,
 validTo: null,
 }
 }
 const price = c.salePrice ?? c.price
 // Flatten Flipp's deal annotations into one user-readable line.
 // pre/post examples: "with $10 purchase", "Members only", "Limit 1"
 const dealBits: string[] = []
 if (c.preText) dealBits.push(c.preText.trim())
 if (c.postText) dealBits.push(c.postText.trim())
 if (c.saleStory && c.saleStory !== String(c.price)) dealBits.push(c.saleStory.trim())
 const dealCondition = dealBits.length > 0 ? dealBits.join(' · ') : null
 return {
 userInput,
 product: {
 id: c.id,
 name: c.productName,
 brand: c.brand,
 imageUrl: c.imageUrl,
 price: {
 regular: c.price,
 sale: c.salePrice,
 },
 } as any,
 price,
 pricePerUnit: c.pricePerUnit,
 pricePerUnitFormatted: c.pricePerUnitFormatted,
 sizeLabel:
 c.classification.estimatedSizeUnit !== 'unknown'
 ? `${c.classification.estimatedSize} ${c.classification.estimatedSizeUnit}`
 : c.size || null,
 dealCondition,
 validTo: c.validTo || null,
 hasConditionalPricing: c.classification.hasConditionalPricing,
 }
 }

 const storeResults: StoreResult[] = []

 // KROGER — fan out classified Kroger candidates across every nearby physical store.
 // Prices are zone-level, not per-store, so all nearby stores share the same item set.
 const krogerItemMap = retailerToItems.get('kroger')
 if (krogerItemMap && stores.length > 0) {
 for (const store of stores) {
 let distance: string | null = null
 if (userCoords && store.location?.lat && store.location?.lng) {
 const d = calculateDistance(
 userCoords.lat,
 userCoords.lng,
 store.location.lat,
 store.location.lng,
 )
 distance = d.toFixed(1)
 }
 const itemRows = items.map((it) => candidateToRow(it, krogerItemMap.get(it)))
 const found = itemRows.filter((r) => r.price !== null).length
 const total = itemRows.reduce((s, r) => s + (r.price || 0), 0)
 storeResults.push({
 storeId: store.id,
 storeName: store.name,
 retailer: store.chain || 'Kroger',
 distance,
 address: store.address
 ? `${store.address}, ${store.city}, ${store.state} ${store.zip}`
 : undefined,
 items: itemRows as any,
 total,
 itemsFound: found,
 itemsMissing: items.length - found,
 })
 }
 }

 // BODEGAS — keep the existing flow; bodega inventory isn't classified yet.
 for (const bodegaStore of bodegaStores) {
 const storeInventory =
 bodegaInventory.get(bodegaStore.id) ||
 items.map((item) => ({ userInput: item, product: null, price: null }))
 const bodegaItemsWithPrices = storeInventory.filter((i: any) => i.price !== null)
 const bodegaTotal = bodegaItemsWithPrices.reduce(
 (sum: number, i: any) => sum + (i.price || 0),
 0,
 )
 storeResults.push({
 storeId: bodegaStore.id,
 storeName: bodegaStore.name || bodegaStore.store_owner?.business_name || 'Local Store',
 retailer: 'Local Store',
 distance: bodegaStore.distance?.toString() || null,
 address: bodegaStore.address
 ? `${bodegaStore.address}, ${bodegaStore.city}, ${bodegaStore.state} ${bodegaStore.zip}`
 : undefined,
 items: storeInventory,
 total: bodegaTotal,
 itemsFound: bodegaItemsWithPrices.length,
 itemsMissing: items.length - bodegaItemsWithPrices.length,
 })
 }

 // ALL OTHER RETAILERS — one row per retailer that survived classification.
 for (const [slug, itemMap] of retailerToItems) {
 if (slug === 'kroger') continue // already handled with physical-store fan-out
 const meta = retailerMeta.get(slug)
 if (!meta) continue

 const itemRows = items.map((it) => candidateToRow(it, itemMap.get(it)))
 const found = itemRows.filter((r) => r.price !== null).length
 if (found === 0) continue
 const total = itemRows.reduce((s, r) => s + (r.price || 0), 0)

 let distance: string | null = null
 let address = 'Online'
 let storeName = meta.name

 if (meta.source === 'flipp') {
 address = 'Weekly ad price (Flipp)'
 } else if (meta.source === 'target') {
 if (targetStoreInfo) {
 storeName = `Target — ${targetStoreInfo.name}`
 address = [targetStoreInfo.city, targetStoreInfo.state].filter(Boolean).join(', ')
 if (
 userCoords &&
 typeof targetStoreInfo.lat === 'number' &&
 typeof targetStoreInfo.lng === 'number'
 ) {
 distance = calculateDistance(
 userCoords.lat,
 userCoords.lng,
 targetStoreInfo.lat,
 targetStoreInfo.lng,
 ).toFixed(1)
 }
 }
 } else if (meta.source === 'walmart') {
 address = 'Online / Pickup Available'
 } else if (meta.source === 'database') {
 address = 'User-reported (receipts)'
 }

 storeResults.push({
 storeId: `${meta.source}-${slug}`,
 storeName,
 retailer: slug.toUpperCase(),
 distance,
 address,
 items: itemRows as any,
 total,
 itemsFound: found,
 itemsMissing: items.length - found,
 })
 }

 // If literally no store from any source returned anything, bail with a friendly message.
 if (storeResults.length === 0) {
 return NextResponse.json({
 success: true,
 message: 'No stores found near this location. Try expanding your search area.',
 stores: [],
 bestOption: null,
 alternatives: [],
 products: [],
 summary: {
 totalItems: items.length,
 itemsFound: 0,
 itemsMissing: items.length,
 estimatedTotal: 0,
 storesSearched: 0,
 },
 })
 }

 // Sort by: 1) items found (most first), 2) price (lowest first), 3) distance (closest first)
 storeResults.sort((a, b) => {
 // First, prioritize stores with more items found
 if (a.itemsFound !== b.itemsFound) {
 return b.itemsFound - a.itemsFound
 }

 // Then by total price (lowest first)
 if (a.total !== b.total && a.total > 0 && b.total > 0) {
 return a.total - b.total
 }

 // Then by distance (closest first), putting online stores last
 if (!a.distance && !b.distance) return 0
 if (!a.distance) return 1 // Online stores (no distance) go after physical stores
 if (!b.distance) return -1
 return parseFloat(a.distance) - parseFloat(b.distance)
 })

 // Best option = the store that has the MOST of the user's items, then cheapest,
 // then closest. A 1/10 store with the lowest single-item price is NOT a useful
 // recommendation — the user can't actually do their shopping there.
 const bestOptionStore = [...storeResults].sort((a, b) => {
 // 1. Items found wins above all else
 if (a.itemsFound !== b.itemsFound) return b.itemsFound - a.itemsFound

 // 2. Among ties on items found, cheapest total
 if (a.total === 0 && b.total > 0) return 1
 if (b.total === 0 && a.total > 0) return -1
 if (a.total !== b.total) return a.total - b.total

 // 3. Physical stores beat online ones
 if (a.distance && !b.distance) return -1
 if (!a.distance && b.distance) return 1
 if (a.distance && b.distance) return parseFloat(a.distance) - parseFloat(b.distance)

 return 0
 })[0]

 // Build products array from the best option's items (whether Kroger or bodega)
 const isBodegaBestOption = bestOptionStore?.retailer === 'Local Store'
 const bestOptionItems = bestOptionStore?.items || []
 const bestItemsFound = bestOptionItems.filter((i: any) => i.price !== null).length

 const result = {
 success: true,
 dataSource: isBodegaBestOption ? 'local_store' : 'kroger_api',
 userItems: items, // Original user search terms for frontend comparison table
 stores: storeResults,
 bestOption: bestOptionStore ? {
 store: {
 id: bestOptionStore.storeId,
 name: bestOptionStore.storeName,
 retailer: bestOptionStore.retailer,
 distance: bestOptionStore.distance,
 address: bestOptionStore.address,
 },
 total: bestOptionStore.total,
 savings: 0, // Would compare to other retailers
 items: bestOptionStore.items,
 } : null,
 alternatives: storeResults.slice(1).map(store => ({
 store: {
 id: store.storeId,
 name: store.storeName,
 retailer: store.retailer,
 distance: store.distance,
 address: store.address,
 },
 total: store.total,
 items: store.items,
 })),
 // Use best option's items for products display
 products: bestOptionItems.map((item: any) => ({
 userInput: item.userInput,
 name: item.product?.name || item.userInput,
 brand: item.product?.brand || null,
 price: item.price,
 imageUrl: item.product?.imageUrl || null,
 available: item.price !== null,
 })),
 summary: {
 totalItems: items.length,
 itemsFound: bestItemsFound,
 itemsMissing: items.length - bestItemsFound,
 estimatedTotal: bestOptionStore?.total || 0,
 storesSearched: storeResults.length,
 },
 }

 // Save comparison to database (don't await to avoid slowing down response)
 saveComparison(supabase, userId, items, result).catch(err => {
 console.error('[ListAnalyze] Failed to save comparison:', err)
 })

 // PHASE 1: Cache the full comparison result for future identical searches
 if (listHash) {
 cacheComparison(listHash, locationContext || null, items, result).catch(err => {
 console.error('[ListAnalyze] Failed to cache comparison:', err)
 })
 }

 // PHASE 2: Save new products from API calls to local catalog for future fuzzy matching
 // This builds up the catalog over time, reducing future API calls
 const newProductsToSave: Array<{
 name: string
 brand?: string
 upc?: string
 imageUrl?: string
 price?: number
 source: 'kroger' | 'walmart' | 'serpapi'
 }> = []

 // Collect Kroger products that weren't from local catalog
 for (const pr of productResults) {
 if (!pr.fromLocalCatalog && pr.krogerProduct) {
 newProductsToSave.push({
 name: pr.krogerProduct.name,
 brand: pr.krogerProduct.brand,
 upc: pr.krogerProduct.upc,
 imageUrl: pr.krogerProduct.imageUrl,
 price: pr.price || undefined,
 source: 'kroger',
 })
 }
 }

 // Collect Walmart products that weren't from local catalog
 for (const wr of walmartResults) {
 if (!wr.fromLocalCatalog && wr.walmartProduct) {
 newProductsToSave.push({
 name: wr.walmartProduct.name,
 brand: wr.walmartProduct.brand,
 upc: wr.walmartProduct.upc,
 imageUrl: wr.walmartProduct.imageUrl,
 price: wr.price || undefined,
 source: 'serpapi',
 })
 }
 }

 // Save new products asynchronously
 if (newProductsToSave.length > 0) {
 saveProductsToCatalog(newProductsToSave).catch(err => {
 console.error('[ListAnalyze] Failed to save products to catalog:', err)
 })
 }

 // PHASE 3: Log comparison results as LLM training data
 // This builds a rich dataset for improving product matching over time
 const trainingPairs: ComparisonTrainingPair[] = []

 // Collect Kroger matches as training pairs
 for (const pr of productResults) {
 if (pr.krogerProduct) {
 trainingPairs.push({
 userInput: pr.userInput,
 matchedProduct: {
 name: pr.krogerProduct.name,
 brand: pr.krogerProduct.brand,
 upc: pr.krogerProduct.upc,
 },
 source: pr.fromLocalCatalog ? 'local_catalog' : 'kroger',
 confidence: pr.fromLocalCatalog ? 0.85 : 1.0, // API matches are gold standard
 price: pr.price || undefined,
 storeId: primaryStore?.id,
 })
 }
 }

 // Collect Walmart matches as training pairs
 for (const wr of walmartResults) {
 if (wr.walmartProduct) {
 trainingPairs.push({
 userInput: wr.userInput,
 matchedProduct: {
 name: wr.walmartProduct.name,
 brand: wr.walmartProduct.brand,
 upc: wr.walmartProduct.upc,
 },
 source: wr.fromLocalCatalog ? 'local_catalog' : 'walmart',
 confidence: wr.fromLocalCatalog ? 0.85 : 1.0,
 price: wr.price || undefined,
 })
 }
 }

 // Log training data asynchronously (don't slow down response)
 if (trainingPairs.length > 0) {
 logComparisonTrainingBatch(trainingPairs).catch(err => {
 console.error('[ListAnalyze] Failed to log training data:', err)
 })
 }

 return NextResponse.json(result)
}

/**
 * Fallback: Analyze using database (receipt-based prices)
 */
async function analyzeWithDatabase(
 items: string[],
 supabase: any,
 userId: string
) {
 console.log('[ListAnalyze] Using database fallback')

 // Step 1: Match products using DeepSeek
 let matches: Array<{
 userInput: string
 matchedProduct: string
 brand?: string
 size?: string
 confidence: number
 }> = []

 try {
 matches = await deepseekClient.matchProducts(items, {})
 console.log('[ListAnalyze] Product matches:', matches.length)
 } catch (matchError: any) {
 console.warn('[ListAnalyze] DeepSeek matching failed, using basic matching:', matchError.message)
 matches = items.map(item => ({
 userInput: item,
 matchedProduct: item,
 confidence: 0.5,
 }))
 }

 // Step 2: Find or create products in database
 const productIds: string[] = []

 for (const match of matches) {
 const { data: existingProducts } = await supabase
 .from('products')
 .select('id')
 .ilike('name', `%${match.matchedProduct}%`)
 .limit(1)

 if (existingProducts && existingProducts.length > 0) {
 productIds.push(existingProducts[0].id)
 } else {
 const { data: newProduct } = await supabase
 .from('products')
 .insert({
 name: match.matchedProduct,
 brand: match.brand,
 size: match.size,
 })
 .select('id')
 .single()

 if (newProduct) {
 productIds.push(newProduct.id)
 }
 }
 }

 // Step 3: Get aggregated prices for matched products
 const aggregatedPrices = await getAggregatedPrices(productIds)

 const productsWithPrices = aggregatedPrices.filter(p => p.prices.length > 0)
 const productsWithoutPrices = aggregatedPrices.filter(p => p.prices.length === 0)

 let lowestTotal = 0
 let highestTotal = 0

 for (const product of productsWithPrices) {
 if (product.lowestPrice) {
 lowestTotal += product.lowestPrice.price
 }
 if (product.priceRange) {
 highestTotal += product.priceRange.max
 }
 }

 const potentialSavings = highestTotal - lowestTotal

 return NextResponse.json({
 success: true,
 dataSource: 'database',
 matches,
 products: aggregatedPrices,
 summary: {
 totalItems: items.length,
 matchedProducts: matches.length,
 productsWithPrices: productsWithPrices.length,
 productsWithoutPrices: productsWithoutPrices.length,
 potentialSavings: potentialSavings > 0 ? potentialSavings : null,
 lowestEstimatedTotal: lowestTotal > 0 ? lowestTotal : null,
 highestEstimatedTotal: highestTotal > 0 ? highestTotal : null,
 },
 note: productsWithoutPrices.length > 0
 ? `${productsWithoutPrices.length} items have no price data yet. Scan receipts to add prices!`
 : undefined,
 })
}
