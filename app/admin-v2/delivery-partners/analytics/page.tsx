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
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Partner Analytics</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Track clicks, conversions, and revenue from delivery partners</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg focus:border-green-500 focus:outline-none"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <a
            href="/admin-v2/delivery-partners"
            className="px-6 py-3 rounded-lg hover:border-green-500 hover:text-green-500 transition"
            style={{ border: '1px solid var(--border-color)' }}
          >
            Manage Partners
          </a>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          Loading analytics...
        </div>
      ) : analytics ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Clicks</div>
              <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{analytics.summary.totalClicks.toLocaleString()}</div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Conversions</div>
              <div className="text-4xl font-bold text-green-500">{analytics.summary.conversions}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{analytics.summary.conversionRate}% rate</div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Estimated Revenue</div>
              <div className="text-4xl font-bold text-blue-500">${analytics.summary.estimatedRevenue}</div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Confirmed Revenue</div>
              <div className="text-4xl font-bold text-yellow-500">${analytics.summary.actualRevenue}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Avg order: ${analytics.summary.avgOrderValue}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Daily Trend Chart */}
            <div className="col-span-2 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Clicks</h3>
              {analytics.dailyTrend.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {analytics.dailyTrend.slice(-30).map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-green-500/30 hover:bg-green-500/50 rounded-t transition relative"
                        style={{ height: `${(day.clicks / maxClicks) * 100}%`, minHeight: day.clicks > 0 ? '4px' : '0' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs hidden group-hover:block whitespace-nowrap" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          {day.clicks} clicks
                        </div>
                      </div>
                      {i % 5 === 0 && (
                        <div className="text-xs mt-2 -rotate-45 origin-left" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(day.date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  No data for this period
                </div>
              )}
            </div>

            {/* Top Stores */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Stores</h3>
              <div className="space-y-3">
                {analytics.topStores.length > 0 ? (
                  analytics.topStores.slice(0, 5).map((store, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{store.store}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{store.retailer}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{store.clicks}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>clicks</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No store data</div>
                )}
              </div>
            </div>
          </div>

          {/* Partner Breakdown */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Performance by Partner</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
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
                      <tr key={i} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: row.partner?.brand_color || '#666' }}
                            >
                              {row.partner?.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.partner?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{row.clicks.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right font-mono text-green-500">{row.conversions}</td>
                        <td className="py-3 pr-4 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{row.conversionRate.toFixed(1)}%</td>
                        <td className="py-3 pr-4 text-right font-mono" style={{ color: 'var(--text-primary)' }}>${row.avgOrderValue.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-yellow-500">
                          ${(row.actualRevenue || row.estimatedRevenue).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                        No partner data for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Clicks */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Clicks</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
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
                      <tr key={click.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="py-3 pr-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(click.created_at)}
                        </td>
                        <td className="py-3 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>{click.partnerName}</td>
                        <td className="py-3 pr-4">
                          <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{click.store_name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{click.store_retailer}</div>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{click.items_count || '-'}</td>
                        <td className="py-3 pr-4 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                          ${(click.estimated_total || 0).toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {click.deep_link_used ? (
                            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 rounded text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>No</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {click.converted ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-500 rounded text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
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
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          Failed to load analytics
        </div>
      )}
    </div>
  )
}
