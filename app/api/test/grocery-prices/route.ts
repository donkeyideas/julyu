/**
 * Test endpoint for Grocery Prices API
 *
 * Usage: GET /api/test/grocery-prices?query=milk
 *
 * Returns JSON with:
 * - API results (products from Amazon/Walmart)
 * - Rate limit info (calls today, calls this month, limits, percentages)
 * - Success/error status
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchGroceryPrices } from '@/lib/api/grocery-prices-rapidapi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || 'milk'

    console.log('[Test] Grocery Prices API test with query:', query)

    const result = await searchGroceryPrices(query, { limit: 5 })

    return NextResponse.json({
      test: 'Grocery Prices API Test',
      query,
      timestamp: new Date().toISOString(),
      result: {
        success: result.success,
        productsFound: result.products.length,
        products: result.products.slice(0, 3), // Show first 3 products
        error: result.error,
      },
      rateLimitInfo: result.rateLimitInfo || 'No rate limit data available',
    })
  } catch (error: any) {
    console.error('[Test] Grocery Prices API error:', error)
    return NextResponse.json(
      {
        test: 'Grocery Prices API Test',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
