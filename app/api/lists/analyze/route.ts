import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'
import { krogerClient, NormalizedKrogerProduct } from '@/lib/api/kroger'
import { compareShoppingList, getAggregatedPrices } from '@/lib/services/price-aggregator'

/**
 * Save comparison to database and update user savings
 */
async function saveComparison(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  items: string[],
  result: {
    bestOption: { store: { name: string }; total: number } | null
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
      total_savings: 0, // Calculate actual savings when we have multi-store comparison
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
      return await analyzeWithKroger(items, zipCode || '45202', supabase, userId)
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
  zipCode: string,
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
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
  const bestOptionStore = storeResults[0]

  const result = {
    success: true,
    dataSource: 'kroger_api',
    stores: storeResults,
    bestOption: bestOptionStore ? {
      store: {
        id: bestOptionStore.storeId,
        name: bestOptionStore.storeName,
        retailer: bestOptionStore.retailer,
        distance: stores[0].location ? '2.5' : null, // Would calculate actual distance
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
  }

  // Save comparison to database (don't await to avoid slowing down response)
  if (userId !== 'test-user-id') {
    saveComparison(supabase, userId, items, result).catch(err => {
      console.error('[ListAnalyze] Failed to save comparison:', err)
    })
  }

  return NextResponse.json(result)
}

/**
 * Fallback: Analyze using database (receipt-based prices)
 */
async function analyzeWithDatabase(
  items: string[],
  supabase: ReturnType<typeof createServerClient>,
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
