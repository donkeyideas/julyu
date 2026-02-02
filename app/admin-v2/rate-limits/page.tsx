'use client'

import { useEffect, useState } from 'react'

interface UsageStats {
  api_name: string
  calls_today: number
  calls_this_month: number
  daily_limit: number
  monthly_limit: number
  daily_percentage: number
  monthly_percentage: number
  can_make_call: boolean
  limit_reached: boolean
}

interface CacheStats {
  cachedQueries: number
  totalCacheHits: number
  apiCallsSaved: number
  estimatedSavings: string
  byApi?: {
    walmart: { cachedQueries: number; cacheHits: number }
    kroger: { cachedQueries: number; cacheHits: number }
  }
}

interface ApiConfig {
  name: string
  displayName: string
  description: string
  docsUrl: string
}

const API_CONFIGS: ApiConfig[] = [
  {
    name: 'serpapi',
    displayName: 'SerpApi (Walmart)',
    description: 'Walmart product and price data via SerpApi',
    docsUrl: 'https://serpapi.com/',
  },
  {
    name: 'tesco',
    displayName: 'Tesco API',
    description: 'UK grocery data from Tesco',
    docsUrl: 'https://rapidapi.com/',
  },
  {
    name: 'grocery-prices',
    displayName: 'Grocery Prices API',
    description: 'Multi-store grocery price comparison',
    docsUrl: 'https://rapidapi.com/',
  },
]

function getStatusColor(percentage: number): string {
  if (percentage >= 90) return 'rgb(239, 68, 68)' // red
  if (percentage >= 75) return 'rgb(249, 115, 22)' // orange
  if (percentage >= 50) return 'rgb(234, 179, 8)' // yellow
  return 'rgb(34, 197, 94)' // green
}

export default function RateLimitsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, UsageStats | null>>({})
  const [error, setError] = useState<string | null>(null)
  const [editingApi, setEditingApi] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ daily: number; monthly: number }>({ daily: 0, monthly: 0 })
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState<string | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [clearingCache, setClearingCache] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchCacheStats()
  }, [])

  async function fetchCacheStats() {
    try {
      const response = await fetch('/api/admin/rate-limits/cache-stats')
      if (response.ok) {
        const data = await response.json()
        setCacheStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching cache stats:', err)
    }
  }

  async function handleClearCache() {
    if (!confirm('Clear all cached Walmart search results? This will cause fresh API calls for the next searches.')) {
      return
    }

    try {
      setClearingCache(true)
      const response = await fetch('/api/admin/rate-limits/cache-stats', { method: 'DELETE' })
      if (response.ok) {
        await fetchCacheStats()
      }
    } catch (err: any) {
      console.error('Error clearing cache:', err)
      setError(err.message)
    } finally {
      setClearingCache(false)
    }
  }

  async function fetchStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/rate-limits')
      if (!response.ok) {
        throw new Error('Failed to fetch rate limits')
      }
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      console.error('Error fetching rate limits:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(apiName: string) {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_name: apiName,
          daily_limit: editValues.daily,
          monthly_limit: editValues.monthly,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update limits')
      }

      setEditingApi(null)
      await fetchStats()
    } catch (err: any) {
      console.error('Error saving rate limits:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetUsage(apiName: string) {
    if (!confirm(`Reset today's usage counter for ${apiName}? This will allow more API calls.`)) {
      return
    }

    try {
      setResetting(apiName)
      const response = await fetch('/api/admin/rate-limits/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_name: apiName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset usage')
      }

      await fetchStats()
    } catch (err: any) {
      console.error('Error resetting usage:', err)
      setError(err.message)
    } finally {
      setResetting(null)
    }
  }

  function startEditing(apiName: string, currentDaily: number, currentMonthly: number) {
    setEditingApi(apiName)
    setEditValues({ daily: currentDaily, monthly: currentMonthly })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading rate limits...</div>
        </div>
      </div>
    )
  }

  const hasAnyStats = Object.values(stats).some(s => s !== null)

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>API Rate Limits</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Monitor and configure API usage limits</p>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="flex justify-between items-center">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* API Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {API_CONFIGS.map((api) => {
          const apiStats = stats[api.name === 'grocery-prices' ? 'groceryPrices' : api.name]
          const isEditing = editingApi === api.name

          if (!apiStats) {
            return (
              <div
                key={api.name}
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', opacity: 0.6 }}
              >
                <div className="mb-4">
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{api.displayName}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not configured</p>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{api.description}</p>
              </div>
            )
          }

          const dailyColor = getStatusColor(apiStats.daily_percentage)
          const monthlyColor = getStatusColor(apiStats.monthly_percentage)

          return (
            <div
              key={api.name}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: apiStats.limit_reached ? '2px solid rgb(239, 68, 68)' : '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{api.displayName}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{api.description}</p>
                </div>
                {apiStats.limit_reached && (
                  <span className="px-2 py-1 text-xs font-bold rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(239, 68, 68)' }}>
                    LIMIT REACHED
                  </span>
                )}
              </div>

              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Daily Limit</label>
                    <input
                      type="number"
                      value={editValues.daily}
                      onChange={(e) => setEditValues(v => ({ ...v, daily: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      min={0}
                      max={100000}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Limit</label>
                    <input
                      type="number"
                      value={editValues.monthly}
                      onChange={(e) => setEditValues(v => ({ ...v, monthly: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      min={0}
                      max={1000000}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(api.name)}
                      disabled={saving}
                      className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingApi(null)}
                      className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <>
                  {/* Daily Usage */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Daily Usage</span>
                      <span style={{ color: dailyColor }}>
                        {apiStats.calls_today} / {apiStats.daily_limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(apiStats.daily_percentage, 100)}%`,
                          backgroundColor: dailyColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Monthly Usage */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Monthly Usage</span>
                      <span style={{ color: monthlyColor }}>
                        {apiStats.calls_this_month} / {apiStats.monthly_limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(apiStats.monthly_percentage, 100)}%`,
                          backgroundColor: monthlyColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => startEditing(api.name, apiStats.daily_limit, apiStats.monthly_limit)}
                      className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      Edit Limits
                    </button>
                    {apiStats.calls_today > 0 && (
                      <button
                        onClick={() => handleResetUsage(api.name)}
                        disabled={resetting === api.name}
                        className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      >
                        {resetting === api.name ? 'Resetting...' : 'Reset Usage'}
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <a
                      href={api.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      View API Docs
                    </a>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {!hasAnyStats && (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No API Usage Data</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Rate limit tracking will begin once APIs are configured and used.
          </p>
        </div>
      )}

      {/* Cache Stats Section */}
      {cacheStats && (
        <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Search Cache</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Caches search results for 24 hours to reduce API calls
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              {clearingCache ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{cacheStats.cachedQueries}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Cached</div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-3xl font-bold" style={{ color: 'rgb(34, 197, 94)' }}>{cacheStats.totalCacheHits}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cache Hits</div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-3xl font-bold" style={{ color: 'rgb(34, 197, 94)' }}>{cacheStats.apiCallsSaved}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>API Calls Saved</div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-3xl font-bold" style={{ color: 'rgb(249, 115, 22)' }}>{cacheStats.estimatedSavings}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Est. Savings</div>
            </div>
          </div>
          {cacheStats.byApi && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Walmart (SerpApi)</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {cacheStats.byApi.walmart.cachedQueries} cached · {cacheStats.byApi.walmart.cacheHits} hits
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Kroger</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {cacheStats.byApi.kroger.cachedQueries} cached · {cacheStats.byApi.kroger.cacheHits} hits
                </div>
              </div>
            </div>
          )}
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            When 1000 users search for &quot;milk 2%&quot;, only 1 API call is made. The other 999 use cached results.
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How Rate Limiting Works</h2>
        <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Automatic Protection</h3>
            <p className="text-sm">
              Every API call is checked against your configured limits before execution. If the limit is reached, the call is blocked automatically to prevent overage charges.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Alert Thresholds</h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• <span className="text-green-400">Green</span> - Under 50% usage (safe)</li>
              <li>• <span className="text-yellow-400">Yellow</span> - 50-74% usage (monitor)</li>
              <li>• <span className="text-orange-400">Orange</span> - 75-89% usage (warning)</li>
              <li>• <span className="text-red-400">Red</span> - 90%+ usage (critical)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Limits Reset</h3>
            <p className="text-sm">
              Daily limits reset at midnight UTC. Monthly limits reset on the 1st of each month.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => { fetchStats(); fetchCacheStats(); }}
          className="px-6 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          Refresh Stats
        </button>
      </div>
    </div>
  )
}
