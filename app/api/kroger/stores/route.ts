import { NextRequest, NextResponse } from 'next/server'
import { krogerClient } from '@/lib/api/kroger'

/**
 * Search Kroger stores
 * GET /api/kroger/stores?zipCode=90210&radiusMiles=10&limit=5
 * or
 * GET /api/kroger/stores?lat=34.0901&lng=-118.4065&radiusMiles=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zipCode') || undefined
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const radiusMiles = searchParams.get('radiusMiles')
      ? parseInt(searchParams.get('radiusMiles')!)
      : 10
    const limit = parseInt(searchParams.get('limit') || '10')
    const chain = searchParams.get('chain') || undefined

    if (!zipCode && (!lat || !lng)) {
      return NextResponse.json(
        { error: 'Either zipCode or lat/lng coordinates are required' },
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

    const stores = await krogerClient.searchLocations({
      zipCode,
      lat,
      lng,
      radiusMiles,
      limit,
      chain,
    })

    return NextResponse.json({
      success: true,
      query: { zipCode, lat, lng, radiusMiles, chain },
      count: stores.length,
      stores,
    })
  } catch (error: any) {
    console.error('[Kroger Stores API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Kroger stores' },
      { status: 500 }
    )
  }
}
