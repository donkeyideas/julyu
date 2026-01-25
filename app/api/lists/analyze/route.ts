import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'
import { compareShoppingList, getAggregatedPrices } from '@/lib/services/price-aggregator'

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
    const { items, listId } = body

    // If listId is provided, compare existing list
    if (listId) {
      console.log('[ListAnalyze] Comparing existing list:', listId)
      const comparison = await compareShoppingList(listId)

      return NextResponse.json({
        success: true,
        comparison,
        dataSource: 'aggregated', // Data comes from receipts + any available APIs
      })
    }

    // Otherwise, analyze items directly
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items - provide items array or listId' }, { status: 400 })
    }

    console.log('[ListAnalyze] Analyzing items:', items)

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
      // Fall back to basic matching - just use the input as the product name
      matches = items.map(item => ({
        userInput: item,
        matchedProduct: item,
        confidence: 0.5,
      }))
    }

    // Step 2: Find or create products in database
    const productIds: string[] = []

    for (const match of matches) {
      // Try to find existing product
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .ilike('name', `%${match.matchedProduct}%`)
        .limit(1)

      if (existingProducts && existingProducts.length > 0) {
        productIds.push(existingProducts[0].id)
      } else {
        // Create new product
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

    // Step 4: Calculate recommendations
    const productsWithPrices = aggregatedPrices.filter(p => p.prices.length > 0)
    const productsWithoutPrices = aggregatedPrices.filter(p => p.prices.length === 0)

    // Calculate total savings potential
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
      dataSource: 'aggregated',
      note: productsWithoutPrices.length > 0
        ? `${productsWithoutPrices.length} items have no price data yet. Scan receipts to add prices!`
        : undefined,
    })
  } catch (error: any) {
    console.error('[ListAnalyze] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze list' },
      { status: 500 }
    )
  }
}
