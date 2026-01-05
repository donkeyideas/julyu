'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PerformanceMetrics {
  productMatchingAccuracy: number | null
  receiptParsingAccuracy: number | null
  substitutionAcceptanceRate: number | null
  avgResponseTime: number | null
  totalRequests: number
  successfulRequests: number
  failedRequests: number
}

export default function AIPerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    productMatchingAccuracy: null,
    receiptParsingAccuracy: null,
    substitutionAcceptanceRate: null,
    avgResponseTime: null,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    loadPerformanceMetrics()
  }, [])

  const loadPerformanceMetrics = async () => {
    try {
      const supabase = createClient()

      const { data: usageData } = await supabase
        .from('ai_model_usage')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: trainingData } = await supabase
        .from('ai_training_data')
        .select('*')
        .order('created_at', { ascending: false })

      if (!usageData || usageData.length === 0) {
        setHasData(false)
        setLoading(false)
        return
      }

      setHasData(true)

      const totalRequests = usageData.length
      const successfulRequests = usageData.filter((r: any) => r.success).length
      const failedRequests = totalRequests - successfulRequests

      const responseTimes = usageData
        .filter((r: any) => r.response_time_ms && r.response_time_ms > 0)
        .map((r: any) => r.response_time_ms)
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
          : null

      interface TrainingDataRecord {
        use_case?: string | null
        accuracy_score?: number | null
        user_feedback?: 'positive' | 'negative' | 'neutral' | null
      }

      const productMatchingData = (trainingData?.filter(
        (t: TrainingDataRecord) => t.use_case === 'product_matching' && t.accuracy_score !== null
      ) || []) as TrainingDataRecord[]
      const productMatchingAccuracy =
        productMatchingData.length > 0
          ? (productMatchingData.reduce((sum: number, t: TrainingDataRecord) => sum + (t.accuracy_score || 0), 0) /
              productMatchingData.length) *
            100
          : null

      const receiptParsingData = (trainingData?.filter(
        (t: TrainingDataRecord) => t.use_case === 'receipt_ocr' && t.accuracy_score !== null
      ) || []) as TrainingDataRecord[]
      const receiptParsingAccuracy =
        receiptParsingData.length > 0
          ? (receiptParsingData.reduce((sum: number, t: TrainingDataRecord) => sum + (t.accuracy_score || 0), 0) /
              receiptParsingData.length) *
            100
          : null

      const substitutionData = (trainingData?.filter(
        (t: TrainingDataRecord) => t.use_case === 'product_matching' && t.user_feedback !== null
      ) || []) as TrainingDataRecord[]
      const positiveFeedback = substitutionData.filter((t: TrainingDataRecord) => t.user_feedback === 'positive').length
      const substitutionAcceptanceRate =
        substitutionData.length > 0 ? (positiveFeedback / substitutionData.length) * 100 : null

      setMetrics({
        productMatchingAccuracy,
        receiptParsingAccuracy,
        substitutionAcceptanceRate,
        avgResponseTime,
        totalRequests,
        successfulRequests,
        failedRequests,
      })
    } catch (error) {
      console.error('Error loading performance metrics:', error)
      setHasData(false)
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

  if (!hasData) {
    return (
      <div>
        <div className="mb-10 pb-6 border-b border-gray-800">
          <h1 className="text-4xl font-black">AI Performance Metrics</h1>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">No Performance Data Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Performance metrics will appear here once AI models start processing requests.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">AI Performance Metrics</h1>
        <p className="text-gray-500 mt-2">Track AI model accuracy and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Product Matching Accuracy</div>
          {metrics.productMatchingAccuracy !== null ? (
            <>
              <div className="text-5xl font-black mb-4 text-green-500">
                {metrics.productMatchingAccuracy.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((metrics.productMatchingAccuracy / 98) * 100, 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Receipt Parsing Accuracy</div>
          {metrics.receiptParsingAccuracy !== null ? (
            <>
              <div className="text-5xl font-black mb-4 text-green-500">
                {metrics.receiptParsingAccuracy.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((metrics.receiptParsingAccuracy / 95) * 100, 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Substitution Acceptance Rate</div>
          {metrics.substitutionAcceptanceRate !== null ? (
            <>
              <div className="text-5xl font-black mb-4 text-green-500">
                {metrics.substitutionAcceptanceRate.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${metrics.substitutionAcceptanceRate}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Avg Response Time</div>
          {metrics.avgResponseTime !== null ? (
            <>
              <div className="text-3xl font-black mb-4 text-green-500">
                {metrics.avgResponseTime < 1000
                  ? `${Math.round(metrics.avgResponseTime)}ms`
                  : `${(metrics.avgResponseTime / 1000).toFixed(2)}s`}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((1000 / (metrics.avgResponseTime || 1000)) * 100, 100)}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Requests</div>
          <div className="text-3xl font-black">{metrics.totalRequests.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Success Rate</div>
          <div className="text-3xl font-black text-green-500">
            {metrics.totalRequests > 0
              ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`
              : '—'}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Failed Requests</div>
          <div className="text-3xl font-black text-red-500">{metrics.failedRequests.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}


