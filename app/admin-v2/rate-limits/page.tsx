'use client'

import { useEffect, useState } from 'react'

interface RateLimitConfig {
  id: string
  api_name: 'tesco' | 'grocery-prices'
  daily_limit: number
  monthly_limit: number
  is_enabled: boolean
}

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

export default function RateLimitsPage() {
  const [configs, setConfigs] = useState<RateLimitConfig[]>([])
  const [usage, setUsage] = useState<{ tesco: UsageStats | null; groceryPrices: UsageStats | null }>({
    tesco: null,
    groceryPrices: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits')
      const data = await response.json()

      if (data.success) {
        setConfigs(data.configs || [])
        setUsage(data.usage || { tesco: null, groceryPrices: null })
      }
    } catch (error) {
      console.error('Error loading rate limits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLimit = async (apiName: 'tesco' | 'grocery-prices', dailyLimit: number, monthlyLimit: number, isEnabled: boolean) => {
    setSaving(apiName)
    try {
      const response = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_name: apiName,
          daily_limit: dailyLimit,
          monthly_limit: monthlyLimit,
          is_enabled: isEnabled,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await loadData()
        alert('Rate limits updated successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  const getConfig = (apiName: 'tesco' | 'grocery-prices'): RateLimitConfig | null => {
    return configs.find(c => c.api_name === apiName) || null
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
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

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>API Rate Limits</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Monitor and configure RapidAPI usage limits to prevent overage charges</p>
      </div>

      {/* Tesco API */}
      <RateLimitCard
        apiName="tesco"
        displayName="Tesco Product API"
        description="UK grocery prices from Tesco"
        config={getConfig('tesco')}
        usage={usage.tesco}
        saving={saving === 'tesco'}
        onUpdate={handleUpdateLimit}
        getProgressColor={getProgressColor}
      />

      {/* Grocery Prices API */}
      <RateLimitCard
        apiName="grocery-prices"
        displayName="Grocery Prices API"
        description="Amazon & Walmart prices"
        config={getConfig('grocery-prices')}
        usage={usage.groceryPrices}
        saving={saving === 'grocery-prices'}
        onUpdate={handleUpdateLimit}
        getProgressColor={getProgressColor}
      />

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

interface RateLimitCardProps {
  apiName: 'tesco' | 'grocery-prices'
  displayName: string
  description: string
  config: RateLimitConfig | null
  usage: UsageStats | null
  saving: boolean
  onUpdate: (apiName: 'tesco' | 'grocery-prices', dailyLimit: number, monthlyLimit: number, isEnabled: boolean) => void
  getProgressColor: (percentage: number) => string
}

function RateLimitCard({ apiName, displayName, description, config, usage, saving, onUpdate, getProgressColor }: RateLimitCardProps) {
  const [dailyLimit, setDailyLimit] = useState(config?.daily_limit || 1000)
  const [monthlyLimit, setMonthlyLimit] = useState(config?.monthly_limit || 10000)
  const [isEnabled, setIsEnabled] = useState(config?.is_enabled ?? true)

  useEffect(() => {
    if (config) {
      setDailyLimit(config.daily_limit)
      setMonthlyLimit(config.monthly_limit)
      setIsEnabled(config.is_enabled)
    }
  }, [config])

  const handleSave = () => {
    onUpdate(apiName, dailyLimit, monthlyLimit, isEnabled)
  }

  return (
    <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{displayName}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-green-500"
            />
            <span style={{ color: 'var(--text-primary)' }}>Enabled</span>
          </label>
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Daily Usage */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Daily Usage</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {usage.calls_today.toLocaleString()} / {usage.daily_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
              <div
                className={`h-full transition-all ${getProgressColor(usage.daily_percentage)}`}
                style={{ width: `${Math.min(usage.daily_percentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {usage.daily_percentage.toFixed(1)}% used
              {usage.daily_percentage >= 90 && <span className="text-red-400 ml-2">⚠️ Critical</span>}
              {usage.daily_percentage >= 75 && usage.daily_percentage < 90 && <span className="text-orange-400 ml-2">⚠️ Warning</span>}
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Monthly Usage</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {usage.calls_this_month.toLocaleString()} / {usage.monthly_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
              <div
                className={`h-full transition-all ${getProgressColor(usage.monthly_percentage)}`}
                style={{ width: `${Math.min(usage.monthly_percentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {usage.monthly_percentage.toFixed(1)}% used
              {usage.monthly_percentage >= 90 && <span className="text-red-400 ml-2">⚠️ Critical</span>}
              {usage.monthly_percentage >= 75 && usage.monthly_percentage < 90 && <span className="text-orange-400 ml-2">⚠️ Warning</span>}
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Daily Limit</label>
          <input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
            min="0"
            max="100000"
            className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Maximum calls per day (0-100,000)</p>
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Monthly Limit</label>
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 0)}
            min="0"
            max="1000000"
            className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Maximum calls per month (0-1,000,000)</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Limits'}
      </button>
    </div>
  )
}
