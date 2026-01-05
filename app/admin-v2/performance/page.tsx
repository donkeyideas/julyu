'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PerformanceMetrics {
  model: string
  totalRequests: number
  successRate: number
  avgResponseTime: number
  avgTokens: number
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data } = await supabase
        .from('ai_model_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      const usage = data || []
      
      // Group by model
      const modelMap = new Map<string, PerformanceMetrics>()
      
      usage.forEach((item: any) => {
        const model = item.model_name || 'unknown'
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            totalRequests: 0,
            successRate: 0,
            avgResponseTime: 0,
            avgTokens: 0,
          })
        }
        
        const metric = modelMap.get(model)!
        metric.totalRequests += 1
        metric.avgResponseTime = (metric.avgResponseTime + (item.response_time_ms || 0)) / 2
        metric.avgTokens = (metric.avgTokens + ((item.input_tokens || 0) + (item.output_tokens || 0))) / 2
      })

      // Calculate success rates
      modelMap.forEach((metric, model) => {
        const modelUsage = usage.filter((item: any) => item.model_name === model)
        const successful = modelUsage.filter((item: any) => item.success !== false).length
        metric.successRate = (successful / modelUsage.length) * 100
      })

      setMetrics(Array.from(modelMap.values()))
    } catch (error) {
      console.error('Error loading metrics:', error)
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading performance metrics...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">AI Performance Metrics</h1>
        <p className="text-gray-500 mt-2">Track AI model performance and accuracy</p>
      </div>

      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric) => (
            <div key={metric.model} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">{metric.model}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total Requests</span>
                    <span className="font-bold">{metric.totalRequests.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Success Rate</span>
                    <span className="font-bold">{metric.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${metric.successRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Avg Response Time</span>
                    <span className="font-bold">{Math.round(metric.avgResponseTime)}ms</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Avg Tokens per Request</span>
                    <span className="font-bold">{Math.round(metric.avgTokens).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-xl font-bold mb-2">No Performance Data</div>
          <div className="text-gray-500">Start using AI models to see performance metrics</div>
        </div>
      )}
    </div>
  )
}


