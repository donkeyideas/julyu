'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CostBreakdown {
  model: string
  requests: number
  inputTokens: number
  outputTokens: number
  cost: number
  avgResponseTime: number
}

export default function PartnershipsCostsPage() {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d')

  const loadCostData = useCallback(async () => {
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

      const { data: usageData } = await supabase
        .from('ai_model_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      const breakdown = calculateCostBreakdown(usageData || [])
      const total = breakdown.reduce((sum, item) => sum + item.cost, 0)

      setCostBreakdown(breakdown)
      setTotalCost(total)
    } catch (error) {
      console.error('Error loading cost data:', error)
      setCostBreakdown([])
      setTotalCost(0)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadCostData()
  }, [loadCostData])

  const calculateCostBreakdown = (usageData: any[]): CostBreakdown[] => {
    const pricing = {
      'deepseek-chat': { input: 0.14, output: 0.28 },
      'gpt-4-vision': { input: 10.00, output: 30.00 },
    }

    const modelMap = new Map<string, CostBreakdown>()

    usageData.forEach((item) => {
      const model = item.model_name || 'unknown'
      const prices = pricing[model as keyof typeof pricing] || { input: 0, output: 0 }
      
      const inputTokens = item.input_tokens || 0
      const outputTokens = item.output_tokens || 0
      const inputCost = (inputTokens / 1_000_000) * prices.input
      const outputCost = (outputTokens / 1_000_000) * prices.output
      const totalCost = inputCost + outputCost

      if (!modelMap.has(model)) {
        modelMap.set(model, {
          model,
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          avgResponseTime: 0,
        })
      }

      const existing = modelMap.get(model)!
      existing.requests += 1
      existing.inputTokens += inputTokens
      existing.outputTokens += outputTokens
      existing.cost += totalCost
      existing.avgResponseTime = (existing.avgResponseTime + (item.response_time_ms || 0)) / 2
    })

    return Array.from(modelMap.values())
  }

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
          <div className="text-gray-500">Loading cost data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Partnerships AI Costs</h1>
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

      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-10">
        <div className="text-sm text-gray-500 mb-2">Total AI Costs</div>
        <div className="text-5xl font-black text-green-500">{formatCurrency(totalCost)}</div>
        <div className="text-xs text-gray-500 mt-2">For selected period</div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Model</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Requests</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Input Tokens</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Output Tokens</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Total Cost</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Avg Response Time</th>
            </tr>
          </thead>
          <tbody>
            {costBreakdown.length > 0 ? (
              costBreakdown.map((item, index) => (
                <tr key={index} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4 font-bold">{item.model}</td>
                  <td className="p-4">{item.requests.toLocaleString()}</td>
                  <td className="p-4">{formatTokens(item.inputTokens)}</td>
                  <td className="p-4">{formatTokens(item.outputTokens)}</td>
                  <td className="p-4 font-bold text-green-500">{formatCurrency(item.cost)}</td>
                  <td className="p-4">{Math.round(item.avgResponseTime)}ms</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No cost data for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


