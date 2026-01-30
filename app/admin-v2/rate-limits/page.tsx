'use client'

import { useEffect, useState } from 'react'

export default function RateLimitsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

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

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>API Rate Limits</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Monitor and configure API usage limits</p>
      </div>

      {/* No RapidAPI integrations - page placeholder */}
      <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No External APIs Configured</h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Rate limiting is not currently needed. Configure external APIs to enable rate limit monitoring.
        </p>
      </div>

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
    </div>
  )
}
