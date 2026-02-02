/**
 * GET /api/admin/rate-limits/cache-stats — Get cache statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServiceRoleClient() as any

    // Get all cache stats
    const { data: cacheEntries, error } = await supabase
      .from('api_search_cache')
      .select('api_name, hit_count, created_at, expires_at')
      .in('api_name', ['serpapi-walmart', 'kroger'])
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const now = new Date()
    const activeEntries = cacheEntries?.filter((e: any) => new Date(e.expires_at) > now) || []

    // Split by API
    const walmartEntries = activeEntries.filter((e: any) => e.api_name === 'serpapi-walmart')
    const krogerEntries = activeEntries.filter((e: any) => e.api_name === 'kroger')

    const walmartHits = walmartEntries.reduce((sum: number, e: any) => sum + (e.hit_count || 0), 0)
    const krogerHits = krogerEntries.reduce((sum: number, e: any) => sum + (e.hit_count || 0), 0)
    const totalHits = walmartHits + krogerHits

    // Calculate API calls saved (each cache hit = 1 API call saved)
    const apiCallsSaved = totalHits

    return NextResponse.json({
      success: true,
      stats: {
        cachedQueries: activeEntries.length,
        totalCacheHits: totalHits,
        apiCallsSaved,
        estimatedSavings: `$${((apiCallsSaved / 100) * 1.5).toFixed(2)}`, // Rough cost estimate
        byApi: {
          walmart: {
            cachedQueries: walmartEntries.length,
            cacheHits: walmartHits,
          },
          kroger: {
            cachedQueries: krogerEntries.length,
            cacheHits: krogerHits,
          },
        },
      },
    })
  } catch (error: any) {
    console.error('[Cache Stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/rate-limits/cache-stats — Clear cache
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = createServiceRoleClient() as any

    const { error } = await supabase
      .from('api_search_cache')
      .delete()
      .in('api_name', ['serpapi-walmart', 'kroger'])

    if (error) {
      throw error
    }

    console.log('[Cache Stats] Cleared all API search cache entries')

    return NextResponse.json({
      success: true,
      message: 'All cache cleared (Walmart + Kroger)',
    })
  } catch (error: any) {
    console.error('[Cache Stats] Clear error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
