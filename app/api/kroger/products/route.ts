import { NextRequest, NextResponse } from 'next/server'
import { krogerClient, searchAndImportKrogerProducts } from '@/lib/api/kroger'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Search Kroger products
 * GET /api/kroger/products?q=milk&locationId=01400376&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const locationId = searchParams.get('locationId') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    if (!krogerClient.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Kroger API not configured',
          message: 'Set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET environment variables',
          docs: 'https://developer.kroger.com/',
        },
        { status: 503 }
      )
    }

    const products = await krogerClient.searchProducts(query, {
      locationId,
      limit,
    })

    return NextResponse.json({
      success: true,
      query,
      locationId,
      count: products.length,
      products,
    })
  } catch (error: any) {
    console.error('[Kroger Products API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Kroger products' },
      { status: 500 }
    )
  }
}

/**
 * Import Kroger products to database
 * POST /api/kroger/products
 * Body: { query: "milk", locationId: "01400376" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is admin (in production, add proper admin check)
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

    if (!user && !isTestMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, locationId } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    if (!krogerClient.isConfigured()) {
      return NextResponse.json(
        {
          error: 'Kroger API not configured',
          message: 'Set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET environment variables',
        },
        { status: 503 }
      )
    }

    const result = await searchAndImportKrogerProducts(supabase, query, locationId)

    return NextResponse.json({
      success: true,
      imported: result.imported,
      total: result.products.length,
      products: result.products,
    })
  } catch (error: any) {
    console.error('[Kroger Products API] Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import Kroger products' },
      { status: 500 }
    )
  }
}
