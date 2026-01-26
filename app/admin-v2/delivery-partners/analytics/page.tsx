'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  summary: {
    totalClicks: number
    conversions: number
    conversionRate: string
    totalRevenue: string
    estimatedRevenue: string
    actualRevenue: string
    avgOrderValue: string
    dateRange: { start: string; end: string }
  }
  byPartner: Array<{
    partner: { id: string; name: string; slug: string; brand_color: string } | null
    clicks: number
    conversions: number
    conversionRate: number
    estimatedRevenue: number
    actualRevenue: number
    totalOrderValue: number
    avgOrderValue: number
  }>
  dailyTrend: Array<{
    date: string
    clicks: number
    conversions: number
    revenue: number
  }>
  topStores: Array<{
    store: string
    retailer: string
    clicks: number
    conversions: number
  }>
  recentClicks: Array<{
    id: string
    partnerName: string
    store_name: string
    store_retailer: string
    items_count: number
    estimated_total: number
    deep_link_used: boolean
    converted: boolean
    created_at: string
  }>
}

export default function DeliveryPartnersAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [selectedPartner, setSelectedPartner] = useState<string>('')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, selectedPartner])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      let url = `/api/admin/delivery-partners/analytics?start=${startDate.toISOString()}`
      if (selectedPartner) {
        url += `&partner_id=${selectedPartner}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Calculate max values for chart scaling
  const maxClicks = analytics?.dailyTrend?.length
    ? Math.max(...analytics.dailyTrend.map(d => d.clicks), 1)
    : 1

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Partner Analytics</h1>
          <p className="text-gray-500 mt-2">Track clicks, conversions, and revenue from delivery partners</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <a
            href="/admin-v2/delivery-partners"
            className="px-6 py-3 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition"
          >
            Manage Partners
          </a>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
          Loading analytics...
        </div>
      ) : analytics ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Clicks</div>
              <div className="text-4xl font-bold">{analytics.summary.totalClicks.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Conversions</div>
              <div className="text-4xl font-bold text-green-500">{analytics.summary.conversions}</div>
              <div className="text-sm text-gray-500 mt-1">{analytics.summary.conversionRate}% rate</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Estimated Revenue</div>
              <div className="text-4xl font-bold text-blue-500">${analytics.summary.estimatedRevenue}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Confirmed Revenue</div>
              <div className="text-4xl font-bold text-yellow-500">${analytics.summary.actualRevenue}</div>
              <div className="text-sm text-gray-500 mt-1">Avg order: ${analytics.summary.avgOrderValue}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Daily Trend Chart */}
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Daily Clicks</h3>
              {analytics.dailyTrend.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {analytics.dailyTrend.slice(-30).map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-green-500/30 hover:bg-green-500/50 rounded-t transition relative"
                        style={{ height: `${(day.clicks / maxClicks) * 100}%`, minHeight: day.clicks > 0 ? '4px' : '0' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs hidden group-hover:block whitespace-nowrap">
                          {day.clicks} clicks
                        </div>
                      </div>
                      {i % 5 === 0 && (
                        <div className="text-xs text-gray-600 mt-2 -rotate-45 origin-left">
                          {formatDate(day.date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  No data for this period
                </div>
              )}
            </div>

            {/* Top Stores */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Top Stores</h3>
              <div className="space-y-3">
                {analytics.topStores.length > 0 ? (
                  analytics.topStores.slice(0, 5).map((store, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <div>
                          <div className="font-medium text-sm">{store.store}</div>
                          <div className="text-xs text-gray-500">{store.retailer}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{store.clicks}</div>
                        <div className="text-xs text-gray-500">clicks</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-4">No store data</div>
                )}
              </div>
            </div>
          </div>

          {/* Partner Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Performance by Partner</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                    <th className="pb-3 pr-4">Partner</th>
                    <th className="pb-3 pr-4 text-right">Clicks</th>
                    <th className="pb-3 pr-4 text-right">Conversions</th>
                    <th className="pb-3 pr-4 text-right">Conv. Rate</th>
                    <th className="pb-3 pr-4 text-right">Avg Order</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byPartner.length > 0 ? (
                    analytics.byPartner.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: row.partner?.brand_color || '#666' }}
                            >
                              {row.partner?.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium">{row.partner?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">{row.clicks.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right font-mono text-green-500">{row.conversions}</td>
                        <td className="py-3 pr-4 text-right font-mono">{row.conversionRate.toFixed(1)}%</td>
                        <td className="py-3 pr-4 text-right font-mono">${row.avgOrderValue.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-yellow-500">
                          ${(row.actualRevenue || row.estimatedRevenue).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No partner data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Clicks */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Recent Clicks</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Partner</th>
                    <th className="pb-3 pr-4">Store</th>
                    <th className="pb-3 pr-4 text-right">Items</th>
                    <th className="pb-3 pr-4 text-right">Est. Total</th>
                    <th className="pb-3 pr-4 text-center">Deep Link</th>
                    <th className="pb-3 text-center">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentClicks.length > 0 ? (
                    analytics.recentClicks.map((click) => (
                      <tr key={click.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 pr-4 text-sm text-gray-400">
                          {formatDateTime(click.created_at)}
                        </td>
                        <td className="py-3 pr-4 font-medium">{click.partnerName}</td>
                        <td className="py-3 pr-4">
                          <div className="text-sm">{click.store_name}</div>
                          <div className="text-xs text-gray-500">{click.store_retailer}</div>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">{click.items_count || '-'}</td>
                        <td className="py-3 pr-4 text-right font-mono">
                          ${(click.estimated_total || 0).toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {click.deep_link_used ? (
                            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 rounded text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded text-xs">No</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {click.converted ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-500 rounded text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No clicks recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
          Failed to load analytics
        </div>
      )}
    </div>
  )
}
