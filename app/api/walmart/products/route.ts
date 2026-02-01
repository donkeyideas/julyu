import { NextRequest, NextResponse } from 'next/server'
import { serpApiWalmartClient, searchAndImportWalmartProducts } from '@/lib/api/serpapi-walmart'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Search Walmart products via SerpApi
 * GET /api/walmart/products?q=milk&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') as 'best_match' | 'price_low' | 'price_high' | 'best_seller' | 'rating_high' | null
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const storeId = searchParams.get('storeId') || undefined

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    if (!serpApiWalmartClient.isConfigured()) {
      return NextResponse.json(
        {
          error: 'SerpApi not configured',
          message: 'Set SERPAPI_API_KEY environment variable',
          docs: 'https://serpapi.com/',
        },
        { status: 503 }
      )
    }

    const products = await serpApiWalmartClient.searchProducts(query, {
      limit,
      sort: sort || undefined,
      minPrice,
      maxPrice,
      storeId,
    })

    return NextResponse.json({
      success: true,
      query,
      count: products.length,
      products,
    })
  } catch (error: any) {
    console.error('[Walmart Products API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Walmart products' },
      { status: 500 }
    )
  }
}

/**
 * Import Walmart products to database
 * POST /api/walmart/products
 * Body: { query: "milk" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is admin (in production, add proper admin check)
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

    if (!user && !isTestMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    if (!serpApiWalmartClient.isConfigured()) {
      return NextResponse.json(
        {
          error: 'SerpApi not configured',
          message: 'Set SERPAPI_API_KEY environment variable',
        },
        { status: 503 }
      )
    }

    const result = await searchAndImportWalmartProducts(supabase, query)

    return NextResponse.json({
      success: true,
      imported: result.imported,
      total: result.products.length,
      products: result.products,
    })
  } catch (error: any) {
    console.error('[Walmart Products API] Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import Walmart products' },
      { status: 500 }
    )
  }
}
