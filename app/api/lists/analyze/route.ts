import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'
import { krogerClient, NormalizedKrogerProduct } from '@/lib/api/kroger'
import { compareShoppingList, getAggregatedPrices } from '@/lib/services/price-aggregator'

interface StoreResult {
  storeId: string
  storeName: string
  retailer: string
  items: Array<{
    userInput: string
    product: NormalizedKrogerProduct | null
    price: number | null
  }>
  total: number
  itemsFound: number
  itemsMissing: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, listId, zipCode } = body

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

    // Check if Kroger API is available
    const krogerAvailable = await krogerClient.isConfiguredAsync()
    console.log('[ListAnalyze] Kroger API available:', krogerAvailable)

    if (krogerAvailable) {
      // Use Kroger API for real-time prices
      return await analyzeWithKroger(items, zipCode || '45202')
    }

    // Fallback to database-based analysis
    return await analyzeWithDatabase(items, supabase)
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
async function analyzeWithKroger(items: string[], zipCode: string) {
  console.log('[ListAnalyze] Using Kroger API with zip:', zipCode)

  // Step 1: Find nearby Kroger stores
  let stores: any[] = []
  try {
    stores = await krogerClient.searchLocations({ zipCode, limit: 5 })
    console.log('[ListAnalyze] Found', stores.length, 'Kroger stores')
  } catch (storeError: any) {
    console.error('[ListAnalyze] Failed to find stores:', storeError.message)
    return NextResponse.json({
      success: false,
      error: 'Failed to find nearby stores. Please check your zip code.',
    }, { status: 400 })
  }

  if (stores.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No Kroger stores found near this zip code',
      stores: [],
      bestOption: null,
      alternatives: [],
    })
  }

  // Step 2: Search for each item at the first store (prices are similar across stores)
  const primaryStore = stores[0]
  const productResults: Array<{
    userInput: string
    krogerProduct: NormalizedKrogerProduct | null
    price: number | null
  }> = []

  for (const item of items) {
    try {
      console.log(`[ListAnalyze] Searching Kroger for: ${item}`)
      const products = await krogerClient.searchProducts(item, {
        locationId: primaryStore.id,
        limit: 1,
      })

      if (products.length > 0) {
        const product = products[0]
        productResults.push({
          userInput: item,
          krogerProduct: product,
          price: product.price?.sale || product.price?.regular || null,
        })
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

  // Step 3: Calculate totals
  const itemsWithPrices = productResults.filter(p => p.price !== null)
  const itemsWithoutPrices = productResults.filter(p => p.price === null)
  const total = itemsWithPrices.reduce((sum, p) => sum + (p.price || 0), 0)

  // Build store results
  const storeResults: StoreResult[] = stores.map((store, index) => ({
    storeId: store.id,
    storeName: store.name,
    retailer: store.chain || 'Kroger',
    items: productResults.map(p => ({
      userInput: p.userInput,
      product: p.krogerProduct,
      price: p.price,
    })),
    total: total, // Same prices for now (would need separate searches for each store)
    itemsFound: itemsWithPrices.length,
    itemsMissing: itemsWithoutPrices.length,
  }))

  // Best option is the closest store with most items
  const bestOption = storeResults[0]

  return NextResponse.json({
    success: true,
    dataSource: 'kroger_api',
    stores: storeResults,
    bestOption: bestOption ? {
      store: {
        id: bestOption.storeId,
        name: bestOption.storeName,
        retailer: bestOption.retailer,
        distance: stores[0].location ? '2.5' : null, // Would calculate actual distance
      },
      total: bestOption.total,
      savings: 0, // Would compare to other retailers
      items: bestOption.items,
    } : null,
    alternatives: storeResults.slice(1).map(store => ({
      store: {
        id: store.storeId,
        name: store.storeName,
        retailer: store.retailer,
      },
      total: store.total,
      items: store.items,
    })),
    products: productResults.map(p => ({
      userInput: p.userInput,
      name: p.krogerProduct?.name || p.userInput,
      brand: p.krogerProduct?.brand,
      price: p.price,
      imageUrl: p.krogerProduct?.imageUrl,
      available: p.krogerProduct !== null,
    })),
    summary: {
      totalItems: items.length,
      itemsFound: itemsWithPrices.length,
      itemsMissing: itemsWithoutPrices.length,
      estimatedTotal: total,
      storesSearched: stores.length,
    },
  })
}

/**
 * Fallback: Analyze using database (receipt-based prices)
 */
async function analyzeWithDatabase(items: string[], supabase: any) {
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
