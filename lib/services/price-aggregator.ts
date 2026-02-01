import { createServerClient } from '@/lib/supabase/server'
import { openFoodFactsClient, NormalizedProduct } from '@/lib/api/openfoodfacts'
import { krogerClient, NormalizedKrogerProduct } from '@/lib/api/kroger'
import { serpApiWalmartClient, NormalizedWalmartProduct } from '@/lib/api/serpapi-walmart'

/**
 * Price Aggregator Service
 * Combines price data from multiple sources:
 * - Receipt scans (crowdsourced)
 * - Open Food Facts (product info)
 * - Kroger API (real-time prices)
 * - Walmart via SerpApi (real-time prices)
 */

interface PriceSource {
  source: string
  price: number
  storeName?: string
  storeId?: string
  confidence: number
  lastUpdated: string
  isOnSale?: boolean
}

interface AggregatedPrice {
  productId: string
  productName: string
  brand?: string
  category?: string
  imageUrl?: string
  upc?: string
  prices: PriceSource[]
  lowestPrice: PriceSource | null
  averagePrice: number | null
  priceRange: { min: number; max: number } | null
  dataQuality: 'high' | 'medium' | 'low'
  lastUpdated: string
}

interface ListItem {
  id: string
  user_input: string
  matched_product_id: string | null
  quantity: number
}

interface ComparisonResult {
  products: AggregatedPrice[]
  totalPotentialSavings: number
  recommendedStore?: {
    storeId: string
    storeName: string
    totalCost: number
    itemCount: number
  }
  alternativeStores: Array<{
    storeId: string
    storeName: string
    totalCost: number
    itemCount: number
    missingItems: number
  }>
}

/**
 * Get aggregated prices for a list of products
 */
export async function getAggregatedPrices(
  productIds: string[]
): Promise<AggregatedPrice[]> {
  const supabase = await createServerClient()
  const results: AggregatedPrice[] = []

  for (const productId of productIds) {
    const aggregated = await getProductPrices(supabase, productId)
    if (aggregated) {
      results.push(aggregated)
    }
  }

  return results
}

/**
 * Get aggregated prices for a single product
 */
async function getProductPrices(
  supabase: any,
  productId: string
): Promise<AggregatedPrice | null> {
  try {
    // Get product info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, brand, category, upc, image_url')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error(`[PriceAggregator] Product not found: ${productId}`)
      return null
    }

    // Get all prices for this product from different stores
    const { data: prices, error: pricesError } = await supabase
      .from('prices')
      .select(`
        id,
        price,
        sale_price,
        source,
        confidence,
        effective_date,
        expires_at,
        store:stores(id, name, retailer)
      `)
      .eq('product_id', productId)
      .order('effective_date', { ascending: false })

    if (pricesError) {
      console.error(`[PriceAggregator] Error fetching prices:`, pricesError)
      return null
    }

    // Aggregate prices by store (keep most recent per store)
    const pricesByStore = new Map<string, PriceSource>()
    const now = new Date()

    for (const priceRecord of prices || []) {
      const storeId = priceRecord.store?.id
      if (!storeId) continue

      // Skip expired prices
      if (priceRecord.expires_at && new Date(priceRecord.expires_at) < now) {
        continue
      }

      // Keep only the most recent price per store
      if (!pricesByStore.has(storeId)) {
        pricesByStore.set(storeId, {
          source: priceRecord.source || 'unknown',
          price: priceRecord.sale_price || priceRecord.price,
          storeName: priceRecord.store?.name,
          storeId: storeId,
          confidence: priceRecord.confidence || 0.5,
          lastUpdated: priceRecord.effective_date,
          isOnSale: !!priceRecord.sale_price,
        })
      }
    }

    // Try to get Kroger prices if product has UPC and Kroger is configured
    if (product.upc && krogerClient.isConfigured()) {
      try {
        const krogerProducts = await krogerClient.getProductsByUPC([product.upc])
        for (const kp of krogerProducts) {
          if (kp.price) {
            const krogerStoreId = `kroger-${kp.id}`
            if (!pricesByStore.has(krogerStoreId)) {
              pricesByStore.set(krogerStoreId, {
                source: 'kroger_api',
                price: kp.price.sale || kp.price.regular,
                storeName: 'Kroger',
                storeId: krogerStoreId,
                confidence: 1.0,
                lastUpdated: new Date().toISOString(),
                isOnSale: !!kp.price.sale,
              })
            }
          }
        }
      } catch (krogerError) {
        console.warn('[PriceAggregator] Kroger fetch failed:', krogerError)
      }
    }

    // Try to get Walmart prices via SerpApi if product name exists
    if (product.name && serpApiWalmartClient.isConfigured()) {
      try {
        // Search by product name, limit to 3 results to conserve API quota
        const walmartProducts = await serpApiWalmartClient.searchProducts(product.name, { limit: 3 })
        for (const wp of walmartProducts) {
          if (wp.price) {
            const walmartStoreId = `walmart-${wp.id}`
            if (!pricesByStore.has(walmartStoreId)) {
              pricesByStore.set(walmartStoreId, {
                source: 'serpapi_walmart',
                price: wp.price.sale || wp.price.regular,
                storeName: 'Walmart',
                storeId: walmartStoreId,
                confidence: 0.9, // Slightly lower than direct API due to search-based matching
                lastUpdated: new Date().toISOString(),
                isOnSale: !!wp.price.sale,
              })
            }
          }
        }
      } catch (walmartError) {
        console.warn('[PriceAggregator] Walmart fetch failed:', walmartError)
      }
    }

    const allPrices = Array.from(pricesByStore.values())

    // Calculate statistics
    let lowestPrice: PriceSource | null = null
    let totalPrice = 0

    for (const price of allPrices) {
      totalPrice += price.price
      if (!lowestPrice || price.price < lowestPrice.price) {
        lowestPrice = price
      }
    }

    const averagePrice = allPrices.length > 0 ? totalPrice / allPrices.length : null
    const priceRange = allPrices.length > 0 ? {
      min: Math.min(...allPrices.map(p => p.price)),
      max: Math.max(...allPrices.map(p => p.price)),
    } : null

    // Determine data quality based on number of sources and recency
    let dataQuality: 'high' | 'medium' | 'low' = 'low'
    if (allPrices.length >= 5) {
      dataQuality = 'high'
    } else if (allPrices.length >= 2) {
      dataQuality = 'medium'
    }

    return {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      imageUrl: product.image_url,
      upc: product.upc,
      prices: allPrices,
      lowestPrice,
      averagePrice,
      priceRange,
      dataQuality,
      lastUpdated: allPrices.length > 0
        ? allPrices.reduce((latest, p) =>
            new Date(p.lastUpdated) > new Date(latest) ? p.lastUpdated : latest,
            allPrices[0].lastUpdated
          )
        : new Date().toISOString(),
    }
  } catch (error) {
    console.error(`[PriceAggregator] Error:`, error)
    return null
  }
}

/**
 * Compare prices for a shopping list across stores
 */
export async function compareShoppingList(
  listId: string
): Promise<ComparisonResult> {
  const supabase = await createServerClient()

  // Get list items
  const { data: items, error: itemsError } = await supabase
    .from('list_items')
    .select('id, user_input, matched_product_id, quantity')
    .eq('list_id', listId) as { data: ListItem[] | null; error: any }

  if (itemsError || !items) {
    throw new Error('Failed to fetch list items')
  }

  // Get aggregated prices for matched products
  const productIds = items
    .filter((item: ListItem) => item.matched_product_id)
    .map((item: ListItem) => item.matched_product_id as string)

  const aggregatedPrices = await getAggregatedPrices(productIds)

  // Calculate totals by store
  const storeTotals = new Map<string, {
    storeId: string
    storeName: string
    totalCost: number
    itemCount: number
    missingItems: number
  }>()

  for (const product of aggregatedPrices) {
    for (const price of product.prices) {
      if (!price.storeId) continue

      const existing = storeTotals.get(price.storeId) || {
        storeId: price.storeId,
        storeName: price.storeName || 'Unknown Store',
        totalCost: 0,
        itemCount: 0,
        missingItems: 0,
      }

      const item = items.find((i: ListItem) => i.matched_product_id === product.productId)
      const quantity = item?.quantity || 1

      existing.totalCost += price.price * quantity
      existing.itemCount += 1
      storeTotals.set(price.storeId, existing)
    }
  }

  // Find stores with missing items
  const totalItems = items.length
  for (const [storeId, store] of storeTotals) {
    store.missingItems = totalItems - store.itemCount
  }

  // Sort stores by total cost (only include stores with all items first)
  const sortedStores = Array.from(storeTotals.values())
    .sort((a, b) => {
      // Prefer stores with all items
      if (a.missingItems === 0 && b.missingItems > 0) return -1
      if (b.missingItems === 0 && a.missingItems > 0) return 1
      // Then by total cost
      return a.totalCost - b.totalCost
    })

  const recommendedStore = sortedStores.find(s => s.missingItems === 0) || sortedStores[0]
  const alternativeStores = sortedStores.filter(s => s !== recommendedStore).slice(0, 4)

  // Calculate potential savings
  const lowestTotal = sortedStores.length > 0 ? sortedStores[0].totalCost : 0
  const highestTotal = sortedStores.length > 0 ? sortedStores[sortedStores.length - 1].totalCost : 0
  const totalPotentialSavings = highestTotal - lowestTotal

  return {
    products: aggregatedPrices,
    totalPotentialSavings,
    recommendedStore,
    alternativeStores,
  }
}

/**
 * Enrich product data from Open Food Facts if UPC is available
 */
export async function enrichProductData(
  productId: string
): Promise<{ success: boolean; enriched?: NormalizedProduct }> {
  const supabase = await createServerClient()

  // Get product UPC
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, upc, name')
    .eq('id', productId)
    .single()

  if (productError || !product?.upc) {
    return { success: false }
  }

  try {
    const enrichedData = await openFoodFactsClient.getProductByUPC(product.upc)

    if (!enrichedData) {
      return { success: false }
    }

    // Update product with enriched data
    await supabase
      .from('products')
      .update({
        brand: enrichedData.brand || product.name,
        category: enrichedData.category,
        size: enrichedData.size,
        image_url: enrichedData.imageUrl,
        attributes: {
          nutrition: enrichedData.nutrition,
          nutriScore: enrichedData.attributes?.nutriScore,
          novaGroup: enrichedData.attributes?.novaGroup,
          allergens: enrichedData.attributes?.allergens,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    return { success: true, enriched: enrichedData }
  } catch (error) {
    console.error(`[PriceAggregator] Failed to enrich product ${productId}:`, error)
    return { success: false }
  }
}

/**
 * Get price trends for a product
 */
export async function getPriceTrends(
  productId: string,
  days: number = 30
): Promise<Array<{ date: string; avgPrice: number; minPrice: number; maxPrice: number }>> {
  const supabase = await createServerClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: history, error } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('product_id', productId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  if (error || !history) {
    return []
  }

  // Group by date
  const byDate = new Map<string, number[]>()

  for (const record of history) {
    const date = record.recorded_at.split('T')[0]
    const prices = byDate.get(date) || []
    prices.push(record.price)
    byDate.set(date, prices)
  }

  // Calculate daily statistics
  return Array.from(byDate.entries()).map(([date, prices]) => ({
    date,
    avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  }))
}
