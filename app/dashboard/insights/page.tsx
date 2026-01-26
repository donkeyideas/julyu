'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Insight {
  id: string
  insight_type: 'savings' | 'spending' | 'prediction' | 'recommendation' | 'alert'
  title: string
  content: string
  priority: number
  action_url?: string
  created_at?: string
}

const insightIcons: Record<string, JSX.Element> = {
  savings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  spending: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  prediction: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  recommendation: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  alert: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

const insightColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  savings: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', icon: 'bg-green-500/20' },
  spending: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', icon: 'bg-yellow-500/20' },
  prediction: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: 'bg-blue-500/20' },
  recommendation: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', icon: 'bg-purple-500/20' },
  alert: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', icon: 'bg-red-500/20' }
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissInsight = async (insightId: string) => {
    try {
      await fetch('/api/ai/insights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_id: insightId })
      })
      setInsights(prev => prev.filter(i => i.id !== insightId))
    } catch (error) {
      console.error('Failed to dismiss insight:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Generating insights...</div>
        </div>
      </div>
    )
  }

  // Separate high priority (alerts) from others
  const highPriority = insights.filter(i => i.priority >= 3)
  const normalPriority = insights.filter(i => i.priority < 3)

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Smart Insights</h1>
        <p className="text-gray-500 mt-2">AI-powered tips and analysis to help you save more</p>
      </div>

      {/* High Priority Alerts */}
      {highPriority.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Needs Attention
          </h2>
          <div className="space-y-4">
            {highPriority.map(insight => {
              const colors = insightColors[insight.insight_type] || insightColors.recommendation

              return (
                <div
                  key={insight.id}
                  className={`${colors.bg} ${colors.border} border rounded-2xl p-6 relative`}
                >
                  <button
                    onClick={() => dismissInsight(insight.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                    title="Dismiss"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex gap-4">
                    <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center ${colors.text}`}>
                      {insightIcons[insight.insight_type] || insightIcons.recommendation}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{insight.title}</h3>
                      <p className="text-gray-400 mb-4">{insight.content}</p>
                      {insight.action_url && (
                        <Link
                          href={insight.action_url}
                          className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} ${colors.text} rounded-lg font-semibold hover:opacity-80 transition`}
                        >
                          Take Action
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Normal Insights */}
      {normalPriority.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Insights & Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {normalPriority.map(insight => {
              const colors = insightColors[insight.insight_type] || insightColors.recommendation

              return (
                <div
                  key={insight.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition relative group"
                >
                  <button
                    onClick={() => dismissInsight(insight.id)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                    title="Dismiss"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex gap-4">
                    <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center ${colors.text} flex-shrink-0`}>
                      {insightIcons[insight.insight_type] || insightIcons.recommendation}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text} capitalize`}>
                          {insight.insight_type}
                        </span>
                      </div>
                      <h3 className="font-bold mb-2">{insight.title}</h3>
                      <p className="text-gray-500 text-sm mb-3">{insight.content}</p>
                      {insight.action_url && (
                        <Link
                          href={insight.action_url}
                          className="text-green-500 hover:text-green-400 text-sm font-semibold inline-flex items-center gap-1"
                        >
                          Learn more
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">All caught up!</h3>
          <p className="text-gray-500 mb-6">No new insights right now. Keep using Julyu and we&apos;ll generate personalized tips.</p>
          <Link
            href="/dashboard/compare"
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition inline-block"
          >
            Compare Prices
          </Link>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-500">{insights.length}</div>
            <div className="text-sm text-gray-500">Active Insights</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-yellow-500">{highPriority.length}</div>
            <div className="text-sm text-gray-500">Needs Attention</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-purple-500">
              {insights.filter(i => i.insight_type === 'recommendation').length}
            </div>
            <div className="text-sm text-gray-500">Recommendations</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-blue-500">
              {insights.filter(i => i.insight_type === 'savings').length}
            </div>
            <div className="text-sm text-gray-500">Savings Tips</div>
          </div>
        </div>
      </div>
    </div>
  )
}
