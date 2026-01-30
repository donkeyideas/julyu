/**
 * Test endpoint for Tesco API
 *
 * Usage: GET /api/test/tesco?query=milk
 *
 * Returns JSON with:
 * - API results (products from Tesco UK)
 * - Rate limit info (calls today, calls this month, limits, percentages)
 * - Success/error status
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchTescoProducts } from '@/lib/api/tesco-rapidapi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || 'milk'

    console.log('[Test] Tesco API test with query:', query)

    const result = await searchTescoProducts(query, 1, 5)

    return NextResponse.json({
      test: 'Tesco API Test',
      query,
      timestamp: new Date().toISOString(),
      result: {
        success: result.success,
        productsFound: result.products.length,
        total: result.total,
        products: result.products.slice(0, 3), // Show first 3 products
        error: result.error,
      },
      rateLimitInfo: result.rateLimitInfo || 'No rate limit data available',
    })
  } catch (error: any) {
    console.error('[Test] Tesco API error:', error)
    return NextResponse.json(
      {
        test: 'Tesco API Test',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
