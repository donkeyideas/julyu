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

  useEffect(() => {
    fetchStats()
  }, [])

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
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* API Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {API_CONFIGS.map((api) => {
          const apiStats = stats[api.name === 'grocery-prices' ? 'groceryPrices' : api.name]

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
              <div>
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

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
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
          onClick={() => fetchStats()}
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
