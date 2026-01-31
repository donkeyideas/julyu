'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsageRecord {
  id: string
  model_name: string
  use_case: string | null
  input_tokens: number
  output_tokens: number
  cost: number
  response_time_ms: number
  success: boolean
  error_message: string | null
  created_at: string
}

interface TrainingRecord {
  id: string
  use_case: string | null
  accuracy_score: number | null
  user_feedback: 'positive' | 'negative' | 'neutral' | null
  validated: boolean
  created_at: string
}

interface ModelStats {
  name: string
  totalCalls: number
  successfulCalls: number
  avgResponseTime: number
  totalCost: number
  totalTokens: number
  errorRate: number
}

interface DailyStats {
  date: string
  calls: number
  avgResponseTime: number
  errors: number
}

export default function AIPerformancePage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d')

  // Core metrics
  const [totalRequests, setTotalRequests] = useState(0)
  const [successRate, setSuccessRate] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const [failedRequests, setFailedRequests] = useState(0)

  // Model breakdown
  const [modelStats, setModelStats] = useState<ModelStats[]>([])

  // Training data stats
  const [trainingStats, setTrainingStats] = useState({
    total: 0,
    validated: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    avgAccuracy: null as number | null
  })

  // Daily trends
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])

  // Recent errors
  const [recentErrors, setRecentErrors] = useState<UsageRecord[]>([])

  // Response time distribution
  const [responseTimeDistribution, setResponseTimeDistribution] = useState({
    fast: 0,      // < 2s
    medium: 0,    // 2-5s
    slow: 0,      // 5-10s
    verySlow: 0   // > 10s
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
      const { data: usageData } = await supabase
        .from('ai_model_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Fetch training data
      const { data: trainingData } = await supabase
        .from('ai_training_data')
        .select('id, use_case, accuracy_score, user_feedback, validated, created_at')
        .gte('created_at', startDate.toISOString())

      const records = (usageData || []) as UsageRecord[]
      const training = (trainingData || []) as TrainingRecord[]

      // Core metrics
      const total = records.length
      const successful = records.filter(r => r.success).length
      const failed = total - successful
      const avgTime = records.length > 0
        ? records.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / records.length
        : 0

      setTotalRequests(total)
      setSuccessRate(total > 0 ? (successful / total) * 100 : 0)
      setAvgResponseTime(avgTime)
      setFailedRequests(failed)

      // Model breakdown
      const modelMap = new Map<string, UsageRecord[]>()
      records.forEach(r => {
        const existing = modelMap.get(r.model_name) || []
        existing.push(r)
        modelMap.set(r.model_name, existing)
      })

      const stats: ModelStats[] = Array.from(modelMap.entries()).map(([name, recs]) => {
        const successfulCalls = recs.filter(r => r.success).length
        return {
          name,
          totalCalls: recs.length,
          successfulCalls,
          avgResponseTime: recs.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / recs.length,
          totalCost: recs.reduce((sum, r) => sum + (r.cost || 0), 0),
          totalTokens: recs.reduce((sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0), 0),
          errorRate: ((recs.length - successfulCalls) / recs.length) * 100
        }
      }).sort((a, b) => b.totalCalls - a.totalCalls)

      setModelStats(stats)

      // Training data stats
      const validated = training.filter(t => t.validated).length
      const positive = training.filter(t => t.user_feedback === 'positive').length
      const negative = training.filter(t => t.user_feedback === 'negative').length
      const withAccuracy = training.filter(t => t.accuracy_score !== null)
      const avgAccuracy = withAccuracy.length > 0
        ? withAccuracy.reduce((sum, t) => sum + (t.accuracy_score || 0), 0) / withAccuracy.length * 100
        : null

      setTrainingStats({
        total: training.length,
        validated,
        positiveFeedback: positive,
        negativeFeedback: negative,
        avgAccuracy
      })

      // Daily trends (last 7 days or 30 days)
      const dailyMap = new Map<string, { calls: number, totalTime: number, errors: number }>()
      records.forEach(r => {
        const date = new Date(r.created_at).toISOString().split('T')[0]
        const existing = dailyMap.get(date) || { calls: 0, totalTime: 0, errors: 0 }
        existing.calls++
        existing.totalTime += r.response_time_ms || 0
        if (!r.success) existing.errors++
        dailyMap.set(date, existing)
      })

      const daily: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          calls: data.calls,
          avgResponseTime: data.calls > 0 ? data.totalTime / data.calls : 0,
          errors: data.errors
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14) // Last 14 days

      setDailyStats(daily)

      // Recent errors
      const errors = records.filter(r => !r.success).slice(0, 10)
      setRecentErrors(errors)

      // Response time distribution
      const dist = { fast: 0, medium: 0, slow: 0, verySlow: 0 }
      records.forEach(r => {
        const time = r.response_time_ms || 0
        if (time < 2000) dist.fast++
        else if (time < 5000) dist.medium++
        else if (time < 10000) dist.slow++
        else dist.verySlow++
      })
      setResponseTimeDistribution(dist)

    } catch (error) {
      console.error('Error loading AI performance data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(6)}`
    return `$${cost.toFixed(4)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading performance metrics...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>AI Performance Metrics</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Track AI model accuracy, latency, and reliability</p>
        </div>
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

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Requests</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalRequests.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Success Rate</div>
          <div className={`text-4xl font-black ${successRate >= 95 ? 'text-green-500' : successRate >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
            {successRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Avg Response Time</div>
          <div className={`text-4xl font-black ${avgResponseTime < 3000 ? 'text-green-500' : avgResponseTime < 8000 ? 'text-yellow-500' : 'text-red-500'}`}>
            {formatTime(avgResponseTime)}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Failed Requests</div>
          <div className={`text-4xl font-black ${failedRequests === 0 ? 'text-green-500' : 'text-red-500'}`}>
            {failedRequests.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Model Performance Breakdown */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Model Performance</h3>
          {modelStats.length > 0 ? (
            <div className="space-y-4">
              {modelStats.map(model => (
                <div key={model.name} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{model.name}</span>
                    <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                      {model.totalCalls.toLocaleString()} calls
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Avg Time</div>
                      <div className={model.avgResponseTime < 3000 ? 'text-green-500' : model.avgResponseTime < 8000 ? 'text-yellow-500' : 'text-red-500'}>
                        {formatTime(model.avgResponseTime)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Error Rate</div>
                      <div className={model.errorRate < 5 ? 'text-green-500' : model.errorRate < 15 ? 'text-yellow-500' : 'text-red-500'}>
                        {model.errorRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Cost</div>
                      <div style={{ color: 'var(--text-primary)' }}>{formatCost(model.totalCost)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No model data available</div>
          )}
        </div>

        {/* Response Time Distribution */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Response Time Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Fast (< 2s)', value: responseTimeDistribution.fast, color: 'bg-green-500' },
              { label: 'Medium (2-5s)', value: responseTimeDistribution.medium, color: 'bg-yellow-500' },
              { label: 'Slow (5-10s)', value: responseTimeDistribution.slow, color: 'bg-orange-500' },
              { label: 'Very Slow (> 10s)', value: responseTimeDistribution.verySlow, color: 'bg-red-500' },
            ].map(item => {
              const total = responseTimeDistribution.fast + responseTimeDistribution.medium + responseTimeDistribution.slow + responseTimeDistribution.verySlow
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.value} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Training Data Stats */}
      <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Training Data Quality</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{trainingStats.total}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Records</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-3xl font-black text-green-500">{trainingStats.validated}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Validated</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-3xl font-black text-green-500">{trainingStats.positiveFeedback}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Positive Feedback</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-3xl font-black text-red-500">{trainingStats.negativeFeedback}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Negative Feedback</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-3xl font-black" style={{ color: trainingStats.avgAccuracy !== null ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              {trainingStats.avgAccuracy !== null ? `${trainingStats.avgAccuracy.toFixed(1)}%` : '—'}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Accuracy</div>
          </div>
        </div>
      </div>

      {/* Daily Trends & Recent Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Trends</h3>
          {dailyStats.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {dailyStats.map(day => (
                <div key={day.date} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{day.calls} calls</span>
                    <span className={day.avgResponseTime < 3000 ? 'text-green-500' : 'text-yellow-500'}>
                      {formatTime(day.avgResponseTime)}
                    </span>
                    {day.errors > 0 && (
                      <span className="text-red-500">{day.errors} errors</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No daily data available</div>
          )}
        </div>

        {/* Recent Errors */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Errors
            {recentErrors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-500">({recentErrors.length})</span>
            )}
          </h3>
          {recentErrors.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentErrors.map(error => (
                <div key={error.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-red-500">{error.model_name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(error.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {error.error_message || 'Unknown error'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-green-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No recent errors
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
