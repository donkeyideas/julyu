'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalUsers: number
  totalRetailers: number
  totalRequests: number
  totalCost: number
  activeModels: number
  avgResponseTime: number
}

interface RevenueData {
  date: string
  revenue: number
  orders: number
  commission: number
}

interface UserGrowthData {
  date: string
  newUsers: number
  activeUsers: number
  receiptsScanned: number
}

export default function AdminV2Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRetailers: 0,
    totalRequests: 0,
    totalCost: 0,
    activeModels: 0,
    avgResponseTime: 0,
  })
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Load all stats
      const [usersResult, retailersResult, usageResult, configResult, ordersResult, recentUsersResult, receiptsResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('partner_retailers').select('*', { count: 'exact', head: true }),
        supabase.from('ai_model_usage').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('ai_model_config').select('*').eq('is_active', true),
        supabase.from('bodega_orders').select('total_amount, commission_amount, ordered_at').gte('ordered_at', thirtyDaysAgo.toISOString()),
        supabase.from('users').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('receipts').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
      ])

      interface UsageRecord {
        cost?: number | null
        response_time_ms?: number | null
      }

      const totalUsers = usersResult.count || 0
      const totalRetailers = retailersResult.count || 0
      const usage = (usageResult.data || []) as UsageRecord[]
      const activeConfigs = configResult.data || []

      const totalRequests = usage.length
      const totalCost = usage.reduce((sum: number, item: UsageRecord) => sum + (item.cost || 0), 0)
      const avgResponseTime = usage.length > 0
        ? usage.reduce((sum: number, item: UsageRecord) => sum + (item.response_time_ms || 0), 0) / usage.length
        : 0

      setStats({
        totalUsers,
        totalRetailers,
        totalRequests,
        totalCost,
        activeModels: activeConfigs.length,
        avgResponseTime: Math.round(avgResponseTime),
      })

      // Process revenue data (last 30 days)
      const orders = ordersResult.data || []
      const revenueByDate: { [key: string]: { revenue: number, orders: number, commission: number } } = {}

      orders.forEach((order: any) => {
        const date = new Date(order.ordered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!revenueByDate[date]) {
          revenueByDate[date] = { revenue: 0, orders: 0, commission: 0 }
        }
        revenueByDate[date].revenue += parseFloat(order.total_amount || 0)
        revenueByDate[date].commission += parseFloat(order.commission_amount || 0)
        revenueByDate[date].orders += 1
      })

      const revenueChartData: RevenueData[] = Object.entries(revenueByDate)
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14) // Last 14 days

      setRevenueData(revenueChartData)

      // Process user growth data (last 30 days)
      const newUsers = recentUsersResult.data || []
      const receipts = receiptsResult.data || []
      const growthByDate: { [key: string]: { newUsers: number, receiptsScanned: number } } = {}

      newUsers.forEach((user: any) => {
        const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!growthByDate[date]) {
          growthByDate[date] = { newUsers: 0, receiptsScanned: 0 }
        }
        growthByDate[date].newUsers += 1
      })

      receipts.forEach((receipt: any) => {
        const date = new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!growthByDate[date]) {
          growthByDate[date] = { newUsers: 0, receiptsScanned: 0 }
        }
        growthByDate[date].receiptsScanned += 1
      })

      const userGrowthChartData: UserGrowthData[] = Object.entries(growthByDate)
        .map(([date, data]) => ({ date, ...data, activeUsers: 0 }))
        .slice(-14) // Last 14 days

      setUserGrowthData(userGrowthChartData)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Complete overview of your Julyu system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Users</div>
          <div className="text-4xl font-black text-green-500">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Registered users</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Retailers</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalRetailers.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Active partnerships</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>AI Requests</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalRequests.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Total API calls</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Cost</div>
          <div className="text-4xl font-black text-green-500">${stats.totalCost.toFixed(4)}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>AI usage costs</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Active Models</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.activeModels}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Configured AI models</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Avg Response Time</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.avgResponseTime}ms</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Across all models</div>
        </div>
      </div>

      {/* Critical KPI Charts */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>📊 Critical Performance Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue & Financial Performance Chart */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Revenue & Financial Performance</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Last 14 days</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-green-500">
                  ${revenueData.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Revenue</div>
              </div>
            </div>

            {revenueData.length > 0 ? (
              <div className="space-y-6">
                {/* Chart */}
                <div className="h-48 flex items-end gap-2">
                  {revenueData.map((day, i) => {
                    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)
                    const height = (day.revenue / maxRevenue) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-green-500/30 hover:bg-green-500/50 rounded-t transition cursor-pointer"
                            style={{ height: `${Math.max(height, 4)}px` }}
                          >
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs hidden group-hover:block whitespace-nowrap z-10" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                              <div className="font-bold text-green-500">${day.revenue.toFixed(2)}</div>
                              <div style={{ color: 'var(--text-muted)' }}>{day.orders} orders</div>
                              <div className="text-yellow-500">${day.commission.toFixed(2)} comm.</div>
                            </div>
                          </div>
                        </div>
                        {i % 2 === 0 && (
                          <div className="text-xs mt-2 rotate-0" style={{ color: 'var(--text-muted)' }}>
                            {day.date}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Commission</span>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {revenueData.reduce((sum, d) => sum + d.orders, 0)} total orders
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                No revenue data available
              </div>
            )}
          </div>

          {/* User Growth & Engagement Chart */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>User Growth & Engagement</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Last 14 days</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-blue-500">
                  {userGrowthData.reduce((sum, d) => sum + d.newUsers, 0)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>New Users</div>
              </div>
            </div>

            {userGrowthData.length > 0 ? (
              <div className="space-y-6">
                {/* Chart */}
                <div className="h-48 flex items-end gap-2">
                  {userGrowthData.map((day, i) => {
                    const maxValue = Math.max(
                      ...userGrowthData.map(d => Math.max(d.newUsers, d.receiptsScanned)),
                      1
                    )
                    const usersHeight = (day.newUsers / maxValue) * 100
                    const receiptsHeight = (day.receiptsScanned / maxValue) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full flex items-end justify-center gap-1">
                          {/* New Users Bar */}
                          <div
                            className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 rounded-t transition cursor-pointer"
                            style={{ height: `${Math.max(usersHeight, 4)}px` }}
                          >
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs hidden group-hover:block whitespace-nowrap z-10" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                              <div className="font-bold text-blue-500">{day.newUsers} new users</div>
                              <div className="text-purple-500">{day.receiptsScanned} receipts</div>
                            </div>
                          </div>
                          {/* Receipts Scanned Bar */}
                          <div
                            className="flex-1 bg-purple-500/30 hover:bg-purple-500/50 rounded-t transition cursor-pointer"
                            style={{ height: `${Math.max(receiptsHeight, 4)}px` }}
                          ></div>
                        </div>
                        {i % 2 === 0 && (
                          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            {day.date}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>New Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Receipts Scanned</span>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {userGrowthData.reduce((sum, d) => sum + d.receiptsScanned, 0)} total scans
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                No user growth data available
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-6 mb-10" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin-v2/ai-models"
            className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg hover:bg-blue-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Manage API Keys</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Configure and test AI model API keys</div>
          </a>
          <a
            href="/admin-v2/usage"
            className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg hover:bg-green-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>View Usage & Costs</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track API usage and costs</div>
          </a>
          <a
            href="/admin-v2/performance"
            className="p-4 bg-purple-500/10 border border-purple-500/50 rounded-lg hover:bg-purple-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Performance Metrics</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>View AI model performance</div>
          </a>
        </div>
      </div>
    </div>
  )
}


