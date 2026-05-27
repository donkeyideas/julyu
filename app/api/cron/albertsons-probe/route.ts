import { NextRequest, NextResponse } from 'next/server'
import { albertsonsClient } from '@/lib/api/albertsons'

export const dynamic = 'force-dynamic'

/**
 * Scheduled Albertsons endpoint probe.
 *
 * Albertsons killed their public xapi (May 2026) and we deprecated the client.
 * This cron retries the known endpoint variants on a schedule so that IF
 * Albertsons ever reopens the namespace, the admin scraper-health dashboard
 * will surface a success row and we'll know to revive the integration.
 *
 * Each probe variant logs its own row to scraper_health_events via
 * albertsonsClient.diagnoseStoreEndpoints(), so this route doesn't need to
 * log anything additional — it just kicks off the probe.
 *
 * Triggering:
 *   - Vercel cron via vercel.json (see config) — recommended
 *   - External scheduler (Upstash Cron, GitHub Actions, manual curl) — also fine
 *   - Manual: hit /api/cron/albertsons-probe (with auth) any time
 *
 * Auth:
 *   - Header `Authorization: Bearer <CRON_SECRET>` matches env CRON_SECRET
 *   - Vercel auto-sets this when invoking its own cron jobs
 *   - In dev (no CRON_SECRET set), runs without auth so local testing works
 *
 * Probe ZIPs are spread across Albertsons family banners to maximize the
 * chance any single one becoming live is caught.
 */

const PROBE_ZIPS = [
  '90210', // Vons/Pavilions (Beverly Hills)
  '94103', // Safeway (San Francisco)
  '60601', // Jewel-Osco (Chicago)
  '75201', // Tom Thumb/Albertsons (Dallas)
  '07030', // Acme (NJ/NYC area)
]

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  // In dev, no secret is fine — lets you curl the route manually
  if (!secret) return true
  const provided =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.nextUrl.searchParams.get('secret')
  return provided === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const perZip: Array<{
    zip: string
    probes: Array<{ url: string; status: number | null; isJsonOk: boolean }>
  }> = []

  let anyAlive = false

  for (const zip of PROBE_ZIPS) {
    try {
      const probes = await albertsonsClient.diagnoseStoreEndpoints(zip)
      const summarized = probes.map((p) => ({
        url: p.url,
        status: p.status,
        // Consider it alive if the server returned a 2xx AND the body was JSON,
        // which is what bodyKeys being present indicates.
        isJsonOk:
          (p.status ?? 0) >= 200 && (p.status ?? 0) < 300 && Array.isArray(p.bodyKeys),
      }))
      perZip.push({ zip, probes: summarized })
      if (summarized.some((s) => s.isJsonOk)) anyAlive = true
    } catch (e: any) {
      perZip.push({ zip, probes: [{ url: 'error', status: null, isJsonOk: false }] })
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    zipsProbed: PROBE_ZIPS.length,
    anyEndpointAlive: anyAlive,
    note: anyAlive
      ? 'An Albertsons endpoint returned valid JSON. Check scraper_health_events for the row and consider reviving the client.'
      : 'All Albertsons endpoints still dead. Failure rows written to scraper_health_events for the dashboard.',
    perZip,
  })
}
