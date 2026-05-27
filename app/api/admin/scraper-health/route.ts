import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Scraper Health Dashboard API
 *
 * Returns:
 *   - 24h + 7d summary cards per source (success rate, latency, cost)
 *   - Recent failures (most recent 50) with error context
 *   - Recent successes sampled (most recent 20) so admin can sanity-check
 *
 * Used by /admin-v2/scraper-health to render the maintenance dashboard.
 *
 * No-auth note: scoped to admin route segment which is already gated upstream
 * by middleware + AdminAuthGuard on the page side. The /api/admin/* routes
 * follow the same convention as the rest of this codebase (e.g.
 * /api/admin/check-api-keys, /api/admin/health) and don't reverify auth here.
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const window = url.searchParams.get('window') || '24h' // '24h' | '7d'

  const supabase = createServiceRoleClient() as any
  const summaryView =
    window === '7d' ? 'scraper_health_summary_7d' : 'scraper_health_summary_24h'

  const [summaryRes, failuresRes, recentRes, costRes] = await Promise.all([
    supabase.from(summaryView).select('*'),
    supabase
      .from('scraper_health_events')
      .select('id, source, operation, error_kind, error_message, http_status, query, zip, latency_ms, created_at')
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('scraper_health_events')
      .select('id, source, operation, success, error_kind, query, zip, result_count, latency_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('scraper_health_events')
      .select('source, cost_usd')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('cost_usd', 'is', null),
  ])

  // Total cost in last 30 days, per source
  const costBySource: Record<string, number> = {}
  for (const row of costRes.data || []) {
    if (row.cost_usd != null) {
      costBySource[row.source] = (costBySource[row.source] || 0) + Number(row.cost_usd)
    }
  }

  return NextResponse.json({
    window,
    summary: summaryRes.data || [],
    recentFailures: failuresRes.data || [],
    recentEvents: recentRes.data || [],
    costBySource30d: costBySource,
    errors: {
      summary: summaryRes.error?.message,
      failures: failuresRes.error?.message,
      recent: recentRes.error?.message,
      cost: costRes.error?.message,
    },
  })
}
