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
        const maxTotal = altTotals.length > 0 ? Math.max(...altTotals) : bestTotal
        return Math.max(0, maxTotal - bestTotal)
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
    product: NormalizedKrogerProduct | null
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
async function getZipCodeCoordinates(zipCode: string): Promise<{ lat: number; lng: number } | null> {
  // Common US zip codes with approximate coordinates
  const zipCoords: Record<string, { lat: number; lng: number }> = {
    '45202': { lat: 39.1031, lng: -84.5120 }, // Cincinnati
    '45203': { lat: 39.1090, lng: -84.5280 },
    '45204': { lat: 39.0960, lng: -84.5580 },
    '45205': { lat: 39.1120, lng: -84.5790 },
    '45206': { lat: 39.1280, lng: -84.4850 },
    '45207': { lat: 39.1380, lng: -84.4720 },
    '45208': { lat: 39.1360, lng: -84.4320 },
    '45209': { lat: 39.1550, lng: -84.4270 },
    '45210': { lat: 39.1150, lng: -84.5020 },
    '45211': { lat: 39.1620, lng: -84.5970 },
    '45212': { lat: 39.1670, lng: -84.4590 },
    '45213': { lat: 39.1820, lng: -84.4190 },
    '45214': { lat: 39.1180, lng: -84.5480 },
    '45215': { lat: 39.2030, lng: -84.4620 },
    '45216': { lat: 39.1950, lng: -84.4930 },
    '45217': { lat: 39.1770, lng: -84.4920 },
    '45218': { lat: 39.2330, lng: -84.4790 },
    '45219': { lat: 39.1280, lng: -84.5130 },
    '45220': { lat: 39.1430, lng: -84.5280 },
    '45223': { lat: 39.1640, lng: -84.5660 },
    '45224': { lat: 39.1930, lng: -84.5280 },
    '45225': { lat: 39.1450, lng: -84.5650 },
    '45226': { lat: 39.1120, lng: -84.4280 },
    '45227': { lat: 39.1550, lng: -84.3850 },
    '45229': { lat: 39.1500, lng: -84.4950 },
    '45230': { lat: 39.0750, lng: -84.3940 },
    '45231': { lat: 39.2150, lng: -84.5280 },
    '45232': { lat: 39.1860, lng: -84.5150 },
    '45233': { lat: 39.1120, lng: -84.6580 },
    '45236': { lat: 39.2090, lng: -84.3900 },
    '45237': { lat: 39.1970, lng: -84.4550 },
    '45238': { lat: 39.0970, lng: -84.6120 },
    '45239': { lat: 39.2000, lng: -84.5700 },
    '45240': { lat: 39.2430, lng: -84.5370 },
    '45241': { lat: 39.2650, lng: -84.4080 },
    '45242': { lat: 39.2430, lng: -84.3520 },
    '45243': { lat: 39.1810, lng: -84.3390 },
    '45244': { lat: 39.1110, lng: -84.3320 },
    '45245': { lat: 39.0690, lng: -84.2850 },
    '45246': { lat: 39.2870, lng: -84.4700 },
    '45247': { lat: 39.2070, lng: -84.6350 },
    '45248': { lat: 39.1610, lng: -84.6700 },
    '45249': { lat: 39.2720, lng: -84.3550 },
    '45251': { lat: 39.2510, lng: -84.5880 },
    '45252': { lat: 39.2660, lng: -84.6080 },
    '45255': { lat: 39.0560, lng: -84.3240 },
  }

  if (zipCoords[zipCode]) {
    return zipCoords[zipCode]
  }

  // For unknown zip codes, return null - we'll show N/A
  return null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
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

  // Step 4: Calculate distances for each store
  const userCoords = await getZipCodeCoordinates(zipCode)
  console.log('[ListAnalyze] User coordinates for zip', zipCode, ':', userCoords)

  // Build store results with distances
  const storeResults: StoreResult[] = stores.map((store, index) => {
    let distance: string | null = null
    if (userCoords && store.location?.lat && store.location?.lng) {
      const distanceMiles = calculateDistance(
        userCoords.lat, userCoords.lng,
        store.location.lat, store.location.lng
      )
      distance = distanceMiles.toFixed(1)
    }
    return {
      storeId: store.id,
      storeName: store.name,
      retailer: store.chain || 'Kroger',
      distance,
      address: store.address ? `${store.address}, ${store.city}, ${store.state} ${store.zip}` : undefined,
      items: productResults.map(p => ({
        userInput: p.userInput,
        product: p.krogerProduct,
        price: p.price,
      })),
      total: total, // Same prices for now (would need separate searches for each store)
      itemsFound: itemsWithPrices.length,
      itemsMissing: itemsWithoutPrices.length,
    }
  })

  // Sort by distance (closest first) if distances are available
  storeResults.sort((a, b) => {
    if (!a.distance && !b.distance) return 0
    if (!a.distance) return 1
    if (!b.distance) return -1
    return parseFloat(a.distance) - parseFloat(b.distance)
  })

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
  saveComparison(supabase, userId, items, result).catch(err => {
    console.error('[ListAnalyze] Failed to save comparison:', err)
  })

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
