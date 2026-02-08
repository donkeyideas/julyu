import { NextRequest, NextResponse } from 'next/server'
import { spoonacularClient } from '@/lib/api/spoonacular'

export const dynamic = 'force-dynamic'

/**
 * Search Spoonacular products
 * GET /api/spoonacular/products?query=milk&number=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const number = parseInt(searchParams.get('number') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const isConfigured = await spoonacularClient.isConfiguredAsync()

    if (!isConfigured) {
      return NextResponse.json({
        error: 'Spoonacular API not configured',
        message: 'Set SPOONACULAR_API_KEY environment variable',
      }, { status: 503 })
    }

    const products = await spoonacularClient.searchGroceryProducts(query, {
      number,
      offset,
    })

    return NextResponse.json({
      success: true,
      query,
      count: products.length,
      products,
    })
  } catch (error: any) {
    console.error('[Spoonacular Products] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    )
  }
}
