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

      // Get all AI usage data
      const { data: usageData } = await supabase
        .from('ai_model_usage')
        .select('*')
        .order('created_at', { ascending: false })

      // Get training data for accuracy calculations
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

      // Calculate metrics
      const totalRequests = usageData.length
      const successfulRequests = usageData.filter((r: any) => r.success).length
      const failedRequests = totalRequests - successfulRequests

      // Calculate average response time
      const responseTimes = usageData
        .filter((r: any) => r.response_time_ms && r.response_time_ms > 0)
        .map((r: any) => r.response_time_ms)
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
          : null

      // Calculate Product Matching Accuracy from training data
      const productMatchingData = trainingData?.filter(
        (t: any) => t.use_case === 'product_matching' && t.accuracy_score !== null
      ) || []
      const productMatchingAccuracy =
        productMatchingData.length > 0
          ? (productMatchingData.reduce((sum: number, t: any) => sum + (t.accuracy_score || 0), 0) /
              productMatchingData.length) *
            100
          : null

      // Calculate Receipt Parsing Accuracy from training data
      const receiptParsingData = trainingData?.filter(
        (t: any) => t.use_case === 'receipt_ocr' && t.accuracy_score !== null
      ) || []
      const receiptParsingAccuracy =
        receiptParsingData.length > 0
          ? (receiptParsingData.reduce((sum: number, t: any) => sum + (t.accuracy_score || 0), 0) /
              receiptParsingData.length) *
            100
          : null

      // Calculate Substitution Acceptance Rate (from user feedback)
      const substitutionData = trainingData?.filter(
        (t: any) => t.use_case === 'product_matching' && t.user_feedback !== null
      ) || []
      const positiveFeedback = substitutionData.filter((t: any) => t.user_feedback === 'positive').length
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

  const formatAccuracy = (value: number | null) => {
    if (value === null) return null
    return `${value.toFixed(1)}%`
  }

  const formatResponseTime = (value: number | null) => {
    if (value === null) return null
    if (value < 1000) return `${Math.round(value)}ms`
    return `${(value / 1000).toFixed(2)}s`
  }

  const getProgressBarWidth = (value: number | null, target: number) => {
    if (value === null) return 0
    return Math.min((value / target) * 100, 100)
  }

  const getAccuracyColor = (value: number | null, target: number) => {
    if (value === null) return 'text-gray-500'
    if (value >= target) return 'text-green-500'
    if (value >= target * 0.9) return 'text-yellow-500'
    return 'text-red-500'
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
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
          <h1 className="text-4xl font-black">AI Performance Metrics</h1>
          <button
            disabled
            className="px-6 py-3 bg-gray-800 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
          >
            Export Report
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">No Performance Data Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Performance metrics will appear here once AI models start processing requests. Make sure API keys are configured and models are being used.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/admin/ai-models"
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Configure AI Models
            </a>
            <a
              href="/admin/ai-costs"
              className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
            >
              View API Usage
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">AI Performance Metrics</h1>
          <button className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
            Export Report
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Product Matching Accuracy */}
        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Product Matching Accuracy</div>
          {metrics.productMatchingAccuracy !== null ? (
            <>
              <div className={`text-5xl font-black mb-4 ${getAccuracyColor(metrics.productMatchingAccuracy, 98)}`}>
                {formatAccuracy(metrics.productMatchingAccuracy)}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${getProgressBarWidth(metrics.productMatchingAccuracy, 98)}%` }}
                ></div>
              </div>
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                Target: 98%+
              </span>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No data available
              </span>
            </>
          )}
        </div>

        {/* Receipt Parsing Accuracy */}
        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Receipt Parsing Accuracy</div>
          {metrics.receiptParsingAccuracy !== null ? (
            <>
              <div className={`text-5xl font-black mb-4 ${getAccuracyColor(metrics.receiptParsingAccuracy, 95)}`}>
                {formatAccuracy(metrics.receiptParsingAccuracy)}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${getProgressBarWidth(metrics.receiptParsingAccuracy, 95)}%` }}
                ></div>
              </div>
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                Target: 95%+
              </span>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No data available
              </span>
            </>
          )}
        </div>

        {/* Substitution Acceptance Rate */}
        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Substitution Acceptance Rate</div>
          {metrics.substitutionAcceptanceRate !== null ? (
            <>
              <div className="text-5xl font-black mb-4 text-green-500">
                {formatAccuracy(metrics.substitutionAcceptanceRate)}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${getProgressBarWidth(metrics.substitutionAcceptanceRate, 100)}%` }}
                ></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                Based on user feedback
              </span>
            </>
          ) : (
            <>
              <div className="text-5xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No feedback data
              </span>
            </>
          )}
        </div>

        {/* Avg AI Response Time */}
        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Avg AI Response Time</div>
          {metrics.avgResponseTime !== null ? (
            <>
              <div className="text-3xl font-black mb-4 text-green-500">
                {formatResponseTime(metrics.avgResponseTime)}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((1000 / (metrics.avgResponseTime || 1000)) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                {metrics.totalRequests} requests
              </span>
            </>
          ) : (
            <>
              <div className="text-3xl font-black text-gray-500 mb-4">—</div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div className="bg-gray-700 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No response data
              </span>
            </>
          )}
        </div>
      </div>

      {/* Additional Stats */}
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
