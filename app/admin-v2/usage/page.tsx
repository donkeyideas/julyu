'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ApiCallRecord {
  id: string
  api_name: string
  endpoint: string | null
  method: string
  status_code: number | null
  response_time_ms: number | null
  success: boolean
  error_message: string | null
  cost: number
  tokens_used: number | null
  use_case: string | null
  created_at: string
}

interface AiUsageRecord {
  id: string
  model_name: string
  input_tokens: number
  output_tokens: number
  cost: number
  response_time_ms: number
  created_at: string
  success: boolean
}

type CombinedRecord = {
  id: string
  source: 'ai' | 'api'
  name: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTimeMs: number
  success: boolean
  errorMessage?: string
  cost: number
  tokens?: number
  useCase?: string
  createdAt: string
}

export default function UsagePage() {
  const [records, setRecords] = useState<CombinedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d')
  const [apiFilter, setApiFilter] = useState<string>('all')
  const [availableApis, setAvailableApis] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const limit = 50

  const [stats, setStats] = useState({
    totalCost: 0,
    totalRequests: 0,
    totalTokens: 0,
    avgResponseTime: 0,
    successRate: 0,
    byApi: {} as Record<string, { calls: number; cost: number; avgTime: number }>
  })

  const loadData = useCallback(async () => {
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

      // Fetch AI model usage
      const { data: aiData } = await supabase
        .from('ai_model_usage')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Fetch general API call logs
      let apiQuery = supabase
        .from('api_call_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (apiFilter !== 'all' && apiFilter !== 'ai_models') {
        apiQuery = apiQuery.eq('api_name', apiFilter)
      }

      const { data: apiData } = await apiQuery

      // Get unique API names for filter dropdown
      const { data: apiNames } = await supabase
        .from('api_call_logs')
        .select('api_name')
        .gte('created_at', startDate.toISOString())

      const uniqueApis = Array.from(new Set<string>((apiNames || []).map((a: { api_name: string }) => a.api_name)))
      setAvailableApis(uniqueApis)

      // Combine and transform records
      const aiRecords: CombinedRecord[] = ((aiData || []) as AiUsageRecord[]).map(r => ({
        id: r.id,
        source: 'ai' as const,
        name: r.model_name,
        responseTimeMs: r.response_time_ms || 0,
        success: r.success ?? true,
        cost: r.cost || 0,
        tokens: (r.input_tokens || 0) + (r.output_tokens || 0),
        createdAt: r.created_at,
      }))

      const apiRecords: CombinedRecord[] = ((apiData || []) as ApiCallRecord[]).map(r => ({
        id: r.id,
        source: 'api' as const,
        name: r.api_name,
        endpoint: r.endpoint || undefined,
        method: r.method,
        statusCode: r.status_code || undefined,
        responseTimeMs: r.response_time_ms || 0,
        success: r.success,
        errorMessage: r.error_message || undefined,
        cost: r.cost || 0,
        tokens: r.tokens_used || undefined,
        useCase: r.use_case || undefined,
        createdAt: r.created_at,
      }))

      // Filter based on selection
      let combined: CombinedRecord[]
      if (apiFilter === 'ai_models') {
        combined = aiRecords
      } else if (apiFilter === 'all') {
        combined = [...aiRecords, ...apiRecords]
      } else {
        combined = apiRecords // Already filtered in query
      }

      // Sort by date
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Calculate stats from ALL data
      const allRecords = [...aiRecords, ...apiRecords]
      const totalCost = allRecords.reduce((sum, r) => sum + r.cost, 0)
      const totalTokens = allRecords.reduce((sum, r) => sum + (r.tokens || 0), 0)
      const avgResponseTime = allRecords.length > 0
        ? allRecords.reduce((sum, r) => sum + r.responseTimeMs, 0) / allRecords.length
        : 0
      const successRate = allRecords.length > 0
        ? (allRecords.filter(r => r.success).length / allRecords.length) * 100
        : 0

      // Stats by API
      const byApi: Record<string, { calls: number; cost: number; avgTime: number }> = {}
      allRecords.forEach(r => {
        if (!byApi[r.name]) {
          byApi[r.name] = { calls: 0, cost: 0, avgTime: 0 }
        }
        byApi[r.name].calls++
        byApi[r.name].cost += r.cost
        byApi[r.name].avgTime += r.responseTimeMs
      })
      Object.keys(byApi).forEach(name => {
        byApi[name].avgTime = Math.round(byApi[name].avgTime / byApi[name].calls)
      })

      setStats({
        totalCost,
        totalRequests: allRecords.length,
        totalTokens,
        avgResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate * 10) / 10,
        byApi
      })

      // Pagination
      setTotalRecords(combined.length)
      setTotalPages(Math.ceil(combined.length / limit))

      // Get current page
      const startIndex = (page - 1) * limit
      const paginatedRecords = combined.slice(startIndex, startIndex + limit)
      setRecords(paginatedRecords)

    } catch (error) {
      console.error('Error loading usage:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [timeRange, apiFilter, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1) // Reset page when filters change
  }, [timeRange, apiFilter])

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0.00'
    if (value < 0.000001) return `$${value.toFixed(8)}`
    if (value < 0.01) return `$${value.toFixed(6)}`
    return `$${value.toFixed(2)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(2)}K`
    return tokens.toLocaleString()
  }

  const getApiColor = (name: string) => {
    const colors: Record<string, string> = {
      'deepseek-chat': 'bg-blue-500',
      'gpt-4': 'bg-green-500',
      'gemini': 'bg-purple-500',
      'kroger': 'bg-red-500',
      'walmart': 'bg-yellow-500',
      'stripe': 'bg-indigo-500',
      'doordash': 'bg-orange-500',
    }
    return colors[name.toLowerCase()] || 'bg-gray-500'
  }

  if (loading && records.length === 0) {
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
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>API Usage & Costs</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Track all API calls across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={apiFilter}
            onChange={(e) => setApiFilter(e.target.value)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="all">All APIs</option>
            <option value="ai_models">AI Models Only</option>
            {availableApis.map(api => (
              <option key={api} value={api}>{api}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Cost</div>
          <div className="text-3xl font-black text-green-500">{formatCurrency(stats.totalCost)}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Requests</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalRequests.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Tokens</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{formatTokens(stats.totalTokens)}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Avg Response</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.avgResponseTime}ms</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Success Rate</div>
          <div className="text-3xl font-black text-green-500">{stats.successRate}%</div>
        </div>
      </div>

      {/* API Breakdown */}
      {Object.keys(stats.byApi).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>API Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(stats.byApi)
              .sort((a, b) => b[1].calls - a[1].calls)
              .slice(0, 12)
              .map(([name, data]) => (
                <div
                  key={name}
                  className="rounded-xl p-3 cursor-pointer hover:ring-2 hover:ring-green-500 transition"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  onClick={() => setApiFilter(name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${getApiColor(name)}`}></div>
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {data.calls.toLocaleString()} calls • {formatCurrency(data.cost)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Call History Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            API Call History
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({totalRecords.toLocaleString()} total)
            </span>
          </h3>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-card)' }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Timestamp</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>API</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Endpoint</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Tokens</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Cost</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Response</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((item) => (
                    <tr key={`${item.source}-${item.id}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="p-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getApiColor(item.name)}`}></div>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {item.method && <span className="text-xs mr-1 px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>{item.method}</span>}
                        {item.endpoint || item.useCase || '—'}
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-primary)' }}>
                        {item.tokens ? formatTokens(item.tokens) : '—'}
                      </td>
                      <td className="p-4 font-mono text-green-500">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-primary)' }}>
                        {item.responseTimeMs}ms
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.success ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                        }`}>
                          {item.success ? (item.statusCode || 'OK') : (item.statusCode || 'Failed')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                      No API calls recorded for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg disabled:opacity-50 transition hover:bg-green-500/10"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  ({((page - 1) * limit) + 1}-{Math.min(page * limit, totalRecords)} of {totalRecords.toLocaleString()})
                </span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg disabled:opacity-50 transition hover:bg-green-500/10"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
