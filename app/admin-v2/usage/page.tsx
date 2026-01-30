'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsageRecord {
  id: string
  model_name: string
  input_tokens: number
  output_tokens: number
  cost: number
  response_time_ms: number
  created_at: string
  success: boolean
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d')
  const [stats, setStats] = useState({
    totalCost: 0,
    totalRequests: 0,
    totalTokens: 0,
    avgResponseTime: 0,
  })

  const loadUsageData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const now = new Date()
      let startDate: Date
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      const { data } = await supabase
        .from('ai_model_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000)

      const usageData = (data || []) as UsageRecord[]
      
      const totalCost = usageData.reduce((sum, item) => sum + (item.cost || 0), 0)
      const totalTokens = usageData.reduce((sum, item) => sum + (item.input_tokens || 0) + (item.output_tokens || 0), 0)
      const avgResponseTime = usageData.length > 0
        ? usageData.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / usageData.length
        : 0

      setUsage(usageData)
      setStats({
        totalCost,
        totalRequests: usageData.length,
        totalTokens,
        avgResponseTime: Math.round(avgResponseTime),
      })
    } catch (error) {
      console.error('Error loading usage:', error)
      setUsage([])
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadUsageData()
  }, [loadUsageData])

  const formatCurrency = (value: number) => {
    if (value < 0.01) return `$${value.toFixed(6)}`
    return `$${value.toFixed(2)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(2)}K`
    return tokens.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading usage data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>API Usage & Costs</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Cost</div>
          <div className="text-4xl font-black text-green-500">{formatCurrency(stats.totalCost)}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Requests</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalRequests.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Tokens</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{formatTokens(stats.totalTokens)}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Avg Response Time</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.avgResponseTime}ms</div>
        </div>
      </div>

      {/* Usage Table */}
      <div>
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>AI Model Call History</h3>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Timestamp</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Model</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Input Tokens</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Output Tokens</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Cost</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Response Time</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {usage.length > 0 ? (
                usage.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{new Date(item.created_at).toLocaleString()}</td>
                    <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>{item.model_name}</td>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{formatTokens(item.input_tokens || 0)}</td>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{formatTokens(item.output_tokens || 0)}</td>
                    <td className="p-4 text-green-500 font-bold">{formatCurrency(item.cost || 0)}</td>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{(item.response_time_ms || 0)}ms</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        item.success ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                      }`}>
                        {item.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No usage data for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


