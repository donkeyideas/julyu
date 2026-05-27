'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Scraper Health — admin maintenance dashboard.
 * Shows what's working, what's failing, and where to look first.
 *
 * Data source: scraper_health_events table populated by lib/services/scraper-health.ts
 * Backend: GET /api/admin/scraper-health?window=24h|7d
 */

interface SummaryRow {
  source: string
  calls: number
  successes: number
  failures: number
  success_rate_pct: number
  avg_latency_ms_ok: number | null
  bot_blocked_count?: number
  rate_limited_count?: number
  no_key_count?: number
  no_results_count?: number
  total_cost_usd: number | null
  last_call_at: string | null
}

interface FailureRow {
  id: number
  source: string
  operation: string
  error_kind: string | null
  error_message: string | null
  http_status: number | null
  query: string | null
  zip: string | null
  latency_ms: number | null
  created_at: string
}

interface RecentRow {
  id: number
  source: string
  operation: string
  success: boolean
  error_kind: string | null
  query: string | null
  zip: string | null
  result_count: number | null
  latency_ms: number | null
  created_at: string
}

interface HealthPayload {
  window: '24h' | '7d'
  summary: SummaryRow[]
  recentFailures: FailureRow[]
  recentEvents: RecentRow[]
  costBySource30d: Record<string, number>
  errors?: Record<string, string | undefined>
}

const SOURCE_LABELS: Record<string, string> = {
  flipp: 'Flipp (Weekly Ads)',
  target: 'Target RedSky',
  kroger: 'Kroger API',
  walmart: 'Walmart (SerpApi)',
  off: 'Open Food Facts',
  equivalence: 'DeepSeek Classifier',
  geocoding: 'Geocoding',
  bodega: 'Bodega Inventory',
  albertsons: 'Albertsons (deprecated)',
}

// Operations ending in _via_proxy mean the scraper had to fall back through
// the residential-proxy pool because the direct call hit a bot-block.
// Render them with a purple chip so admins can see proxy spend at a glance.
function isViaProxy(operation: string): boolean {
  return operation.endsWith('_via_proxy')
}

const ERROR_KIND_TONES: Record<string, string> = {
  bot_blocked: 'bg-red-500/15 text-red-400 border-red-500/40',
  rate_limited: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
  no_key: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
  timeout: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
  parse_error: 'bg-pink-500/15 text-pink-400 border-pink-500/40',
  no_results: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
  http_error: 'bg-red-500/15 text-red-400 border-red-500/40',
  unknown: 'bg-gray-500/15 text-gray-400 border-gray-500/40',
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const s = Math.floor(diffMs / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

function healthTone(successRatePct: number, calls: number): string {
  if (calls === 0) return 'text-gray-400'
  if (successRatePct >= 95) return 'text-green-500'
  if (successRatePct >= 80) return 'text-yellow-500'
  return 'text-red-500'
}

export default function ScraperHealthPage() {
  const [data, setData] = useState<HealthPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [window, setWindow] = useState<'24h' | '7d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/scraper-health?window=${window}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const payload = (await res.json()) as HealthPayload
      setData(payload)
    } finally {
      setLoading(false)
    }
  }, [window])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(load, 15000) // 15s
    return () => clearInterval(t)
  }, [autoRefresh, load])

  const summary = data?.summary || []

  // Combine all known sources so empty sources also show (gives explicit "0 calls" signal)
  const allSources = Array.from(
    new Set([...Object.keys(SOURCE_LABELS), ...summary.map((s) => s.source)]),
  )
  const summaryByName = new Map(summary.map((s) => [s.source, s]))

  return (
    <div className="p-8" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">Scraper Health</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Live status of every external data source. Refreshes every 15s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setWindow('24h')}
              className={`px-3 py-1.5 text-sm ${window === '24h' ? 'bg-green-500 text-black' : ''}`}
              style={window === '24h' ? {} : { color: 'var(--text-secondary)' }}
            >
              24h
            </button>
            <button
              onClick={() => setWindow('7d')}
              className={`px-3 py-1.5 text-sm ${window === '7d' ? 'bg-green-500 text-black' : ''}`}
              style={window === '7d' ? {} : { color: 'var(--text-secondary)' }}
            >
              7d
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm rounded-lg"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Refresh now
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="mt-8" style={{ color: 'var(--text-muted)' }}>
          Loading…
        </div>
      )}

      {data && (
        <>
          {/* Source health cards */}
          <h2 className="text-xl font-semibold mt-8 mb-4">Source health · last {window}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSources.map((src) => {
              const row = summaryByName.get(src)
              const cost30d = data.costBySource30d[src] || 0
              return (
                <div
                  key={src}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{SOURCE_LABELS[src] || src}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {row?.last_call_at ? `last call ${relativeTime(row.last_call_at)}` : 'no calls yet'}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${healthTone(row?.success_rate_pct ?? 0, row?.calls ?? 0)}`}>
                      {row && row.calls > 0 ? `${row.success_rate_pct}%` : '—'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Calls</div>
                      <div className="font-semibold text-base">{row?.calls ?? 0}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Avg latency</div>
                      <div className="font-semibold text-base">
                        {row?.avg_latency_ms_ok ? `${row.avg_latency_ms_ok} ms` : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Cost (30d)</div>
                      <div className="font-semibold text-base">
                        {cost30d > 0 ? `$${cost30d.toFixed(3)}` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Per-error-kind chips for the 24h view */}
                  {window === '24h' && row && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(row.bot_blocked_count || 0) > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${ERROR_KIND_TONES.bot_blocked}`}>
                          {row.bot_blocked_count} bot-blocked
                        </span>
                      )}
                      {(row.rate_limited_count || 0) > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${ERROR_KIND_TONES.rate_limited}`}>
                          {row.rate_limited_count} rate-limited
                        </span>
                      )}
                      {(row.no_key_count || 0) > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${ERROR_KIND_TONES.no_key}`}>
                          {row.no_key_count} key missing
                        </span>
                      )}
                      {(row.no_results_count || 0) > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${ERROR_KIND_TONES.no_results}`}>
                          {row.no_results_count} zero-results
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recent failures */}
          <h2 className="text-xl font-semibold mt-10 mb-4">
            Recent failures{' '}
            <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              · {data.recentFailures.length} shown
            </span>
          </h2>
          {data.recentFailures.length === 0 ? (
            <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              No failures recorded yet. Either nothing has been called, or everything is working.
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--bg-card)' }}>
                  <tr>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Source</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Operation</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Kind</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Query</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>ZIP</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Error</th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentFailures.map((f) => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="p-3 font-medium">{SOURCE_LABELS[f.source] || f.source}</td>
                      <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                        {f.operation}
                        {isViaProxy(f.operation) && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/40">
                            via proxy
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {f.error_kind && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${ERROR_KIND_TONES[f.error_kind] || ERROR_KIND_TONES.unknown}`}>
                            {f.error_kind}
                          </span>
                        )}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-muted)' }}>{f.http_status || '—'}</td>
                      <td className="p-3 truncate max-w-[140px]" style={{ color: 'var(--text-secondary)' }}>{f.query || '—'}</td>
                      <td className="p-3" style={{ color: 'var(--text-muted)' }}>{f.zip || '—'}</td>
                      <td className="p-3 text-xs truncate max-w-[280px]" style={{ color: 'var(--text-muted)' }} title={f.error_message || ''}>
                        {f.error_message || '—'}
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {relativeTime(f.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent events feed (success + failure) */}
          <h2 className="text-xl font-semibold mt-10 mb-4">Recent activity</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--bg-card)' }}>
                <tr>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}></th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Source</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Operation</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Query / ZIP</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Results</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Latency</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>When</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((e) => (
                  <tr key={e.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-3">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${e.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    </td>
                    <td className="p-3 font-medium">{SOURCE_LABELS[e.source] || e.source}</td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                      {e.operation}
                      {isViaProxy(e.operation) && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/40">
                          via proxy
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.query && <span>&quot;{e.query}&quot;</span>}
                      {e.query && e.zip && <span> · </span>}
                      {e.zip && <span>{e.zip}</span>}
                    </td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                      {e.result_count != null ? e.result_count : '—'}
                      {e.error_kind === 'no_results' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">zero</span>
                      )}
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>{e.latency_ms ?? '—'} ms</td>
                    <td className="p-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(e.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.errors?.summary && (
            <div className="mt-6 text-sm text-red-500">
              Query error: {data.errors.summary} — run the latest migration in supabase/migrations/.
            </div>
          )}
        </>
      )}
    </div>
  )
}
