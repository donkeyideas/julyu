/**
 * Comparison Cache Service
 * Caches full shopping list comparison results to eliminate repeat API calls
 *
 * Architecture: List-level caching
 * - Hash the sorted, normalized items list
 * - If exact match found in cache → Return immediately (0 API calls)
 * - If no match → Run API calls, then cache the full result
 *
 * TTL: 4 hours (grocery prices can change during the day)
 */

import { createHash } from 'crypto'

// Cache TTL: 4 hours
const COMPARISON_CACHE_TTL = 4 * 60 * 60 * 1000

/**
 * Normalize an item for consistent hashing
 */
function normalizeItem(item: string): string {
  return item
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .replace(/[^\w\s%]/g, '')    // Remove special chars except %
}

/**
 * Generate a hash for a list of items
 * Items are normalized and sorted to ensure consistent hashing
 */
export function generateListHash(items: string[]): string {
  const normalized = items
    .map(normalizeItem)
    .sort()
    .join('|')

  return createHash('md5').update(normalized).digest('hex')
}

/**
 * Generate a location context string for cache key
 * Rounds coordinates to ~1 mile precision for grouping nearby searches
 */
export function generateLocationContext(
  zipCode?: string,
  lat?: number,
  lng?: number
): string | null {
  if (zipCode) {
    return `zip:${zipCode}`
  }

  if (lat !== undefined && lng !== undefined) {
    // Round to 2 decimal places (~1 mile precision)
    const roundedLat = Math.round(lat * 100) / 100
    const roundedLng = Math.round(lng * 100) / 100
    return `geo:${roundedLat},${roundedLng}`
  }

  return null
}

/**
 * Check cache for existing comparison results
 */
export async function getCachedComparison(
  listHash: string,
  locationContext: string | null
): Promise<any | null> {
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient() as any

    let query = supabase
      .from('comparison_cache')
      .select('results, id, hit_count')
      .eq('list_hash', listHash)
      .gt('expires_at', new Date().toISOString())

    if (locationContext) {
      query = query.eq('location_context', locationContext)
    } else {
      query = query.is('location_context', null)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    // Update hit count asynchronously (don't await)
    supabase
      .from('comparison_cache')
      .update({
        hit_count: (data.hit_count || 0) + 1,
        last_hit_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .then(() => {})
      .catch(() => {})

    console.log(`[ComparisonCache] HIT for hash ${listHash.substring(0, 8)}... (${data.hit_count + 1} total hits)`)
    return data.results
  } catch (error) {
    console.error('[ComparisonCache] Lookup error:', error)
    return null
  }
}

/**
 * Save comparison results to cache
 */
export async function cacheComparison(
  listHash: string,
  locationContext: string | null,
  items: string[],
  results: any
): Promise<void> {
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient() as any

    const expiresAt = new Date(Date.now() + COMPARISON_CACHE_TTL).toISOString()

    const { error } = await supabase
      .from('comparison_cache')
      .upsert({
        list_hash: listHash,
        location_context: locationContext,
        results,
        item_count: items.length,
        expires_at: expiresAt,
        hit_count: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'list_hash,location_context',
      })

    if (error) {
      console.error('[ComparisonCache] Save error:', error)
    } else {
      console.log(`[ComparisonCache] Saved comparison for ${items.length} items (expires in 4h)`)
    }
  } catch (error) {
    console.error('[ComparisonCache] Save error:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getComparisonCacheStats(): Promise<{
  activeEntries: number
  totalHits: number
  avgItemCount: number
}> {
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const supabase = createServiceRoleClient() as any

    const { data, error } = await supabase
      .from('comparison_cache')
      .select('hit_count, item_count')
      .gt('expires_at', new Date().toISOString())

    if (error || !data) {
      return { activeEntries: 0, totalHits: 0, avgItemCount: 0 }
    }

    const totalHits = data.reduce((sum: number, e: any) => sum + (e.hit_count || 0), 0)
    const totalItems = data.reduce((sum: number, e: any) => sum + (e.item_count || 0), 0)

    return {
      activeEntries: data.length,
      totalHits,
      avgItemCount: data.length > 0 ? Math.round(totalItems / data.length) : 0,
    }
  } catch (error) {
    console.error('[ComparisonCache] Stats error:', error)
    return { activeEntries: 0, totalHits: 0, avgItemCount: 0 }
  }
}
