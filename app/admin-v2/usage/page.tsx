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
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading usage data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">API Usage & Costs</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Cost</div>
          <div className="text-4xl font-black text-green-500">{formatCurrency(stats.totalCost)}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Requests</div>
          <div className="text-4xl font-black">{stats.totalRequests.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Tokens</div>
          <div className="text-4xl font-black">{formatTokens(stats.totalTokens)}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Avg Response Time</div>
          <div className="text-4xl font-black">{stats.avgResponseTime}ms</div>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Timestamp</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Model</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Input Tokens</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Output Tokens</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Cost</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Response Time</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {usage.length > 0 ? (
              usage.map((item) => (
                <tr key={item.id} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="p-4 font-bold">{item.model_name}</td>
                  <td className="p-4">{formatTokens(item.input_tokens || 0)}</td>
                  <td className="p-4">{formatTokens(item.output_tokens || 0)}</td>
                  <td className="p-4 text-green-500 font-bold">{formatCurrency(item.cost || 0)}</td>
                  <td className="p-4">{(item.response_time_ms || 0)}ms</td>
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
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No usage data for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


