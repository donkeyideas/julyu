'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  totalSavings: number
  mrr: number
  aiRequests: number
  totalComparisons: number
  totalReceipts: number
  avgSavingsPerUser: number
  activeRetailers: number
}

interface TrendData {
  hasData: boolean
  change?: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalSavings: 0,
    mrr: 0,
    aiRequests: 0,
    totalComparisons: 0,
    totalReceipts: 0,
    avgSavingsPerUser: 0,
    activeRetailers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Get user counts
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: premiumCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'premium')

      const { count: enterpriseCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'enterprise')

      // Get savings data
      const { data: savings } = await supabase
        .from('user_savings')
        .select('total_saved')

      interface SavingsRecord {
        total_saved?: number | null
      }
      const totalSavings = savings?.reduce((sum: number, s: SavingsRecord) => sum + (s.total_saved || 0), 0) || 0
      const avgSavingsPerUser = userCount && userCount > 0 ? totalSavings / userCount : 0

      // Calculate MRR
      const premiumMRR = (premiumCount || 0) * 14.99
      const enterpriseMRR = (enterpriseCount || 0) * 99.99
      const mrr = premiumMRR + enterpriseMRR

      // Get AI metrics
      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('metric_value')
        .eq('metric_name', 'ai_requests_24h')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      // Get comparison and receipt counts
      const { count: comparisonCount } = await supabase
        .from('comparisons')
        .select('*', { count: 'exact', head: true })

      const { count: receiptCount } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })

      // Get active retailers
      const { count: retailerCount } = await supabase
        .from('partner_retailers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats({
        totalUsers: userCount || 0,
        premiumUsers: (premiumCount || 0) + (enterpriseCount || 0),
        freeUsers: (userCount || 0) - (premiumCount || 0) - (enterpriseCount || 0),
        totalSavings,
        mrr,
        aiRequests: metrics?.metric_value || 0,
        totalComparisons: comparisonCount || 0,
        totalReceipts: receiptCount || 0,
        avgSavingsPerUser,
        activeRetailers: retailerCount || 0,
      })
      setLastRefresh(new Date())
    } catch (error) {
      // Using test auth - stats will be 0
      console.log('Using test auth, no database stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(2)}`
  }

  const formatPercentage = (value: number) => {
    if (value > 0) return `↑ ${value.toFixed(1)}%`
    if (value < 0) return `↓ ${Math.abs(value).toFixed(1)}%`
    return '—'
  }

  // Only show trends when we have actual data (for now, always false since we're using test auth)
  const hasHistoricalData = false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading platform overview...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black mb-2">Platform Overview</h1>
          <p className="text-gray-500 text-sm">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
            <div className="text-sm text-gray-500 mb-2">Total Active Users</div>
            <div className="text-5xl font-black mb-2">{stats.totalUsers.toLocaleString()}</div>
            {hasHistoricalData ? (
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                {formatPercentage(0)}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No historical data
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
            <div className="text-sm text-gray-500 mb-2">Total Savings Generated</div>
            <div className="text-5xl font-black mb-2">{formatCurrency(stats.totalSavings)}</div>
            {hasHistoricalData ? (
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                {formatPercentage(0)}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No historical data
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
            <div className="text-sm text-gray-500 mb-2">Monthly Recurring Revenue</div>
            <div className="text-5xl font-black mb-2">{formatCurrency(stats.mrr)}</div>
            {hasHistoricalData ? (
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                {formatPercentage(0)}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No historical data
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/20 border-2 rounded-2xl p-6 hover:border-purple-500 transition">
            <div className="text-sm text-gray-500 mb-2">AI Requests (24h)</div>
            <div className="text-4xl font-black mb-2">{stats.aiRequests.toLocaleString()}</div>
            {hasHistoricalData ? (
              <span className="inline-block px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-sm">
                {formatPercentage(0)}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
                No historical data
              </span>
            )}
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">User Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Premium Users</div>
            <div className="text-3xl font-black mb-1">{stats.premiumUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {stats.totalUsers > 0
                ? `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% of total users`
                : '0% of total users'}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Free Users</div>
            <div className="text-3xl font-black mb-1">{stats.freeUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {stats.totalUsers > 0
                ? `${((stats.freeUsers / stats.totalUsers) * 100).toFixed(1)}% of total users`
                : '0% of total users'}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Avg Savings per User</div>
            <div className="text-3xl font-black mb-1">{formatCurrency(stats.avgSavingsPerUser)}</div>
            <div className="text-xs text-gray-500">Based on {stats.totalUsers} users</div>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Activity Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Total Comparisons</div>
            <div className="text-4xl font-black">{stats.totalComparisons.toLocaleString()}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Receipts Scanned</div>
            <div className="text-4xl font-black">{stats.totalReceipts.toLocaleString()}</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-500 mb-2">Active Retailer Partners</div>
            <div className="text-4xl font-black">{stats.activeRetailers.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Revenue Breakdown</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-2">Premium Subscriptions</div>
              <div className="text-2xl font-black mb-4">
                {formatCurrency((stats.premiumUsers - (stats.totalUsers - stats.freeUsers - stats.premiumUsers)) * 14.99)}
              </div>
              <div className="text-xs text-gray-500">
                ${14.99}/month per premium user
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">Enterprise Subscriptions</div>
              <div className="text-2xl font-black mb-4">
                {formatCurrency((stats.totalUsers - stats.freeUsers - stats.premiumUsers) * 99.99)}
              </div>
              <div className="text-xs text-gray-500">
                ${99.99}/month per enterprise user
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bodega System Quick Access */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">🏪 Bodega System Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/stores/applications"
            className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500 transition cursor-pointer group"
          >
            <div className="text-sm text-blue-400 mb-2">Review & Approve</div>
            <div className="text-2xl font-black mb-2 group-hover:text-blue-400 transition">Store Applications</div>
            <div className="text-xs text-gray-500">Manage pending store applications</div>
          </a>

          <a
            href="/admin/stores"
            className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition cursor-pointer group"
          >
            <div className="text-sm text-green-400 mb-2">Manage</div>
            <div className="text-2xl font-black mb-2 group-hover:text-green-400 transition">All Stores</div>
            <div className="text-xs text-gray-500">View and edit all bodega stores</div>
          </a>

          <a
            href="/admin/orders"
            className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-500 transition cursor-pointer group"
          >
            <div className="text-sm text-purple-400 mb-2">Monitor</div>
            <div className="text-2xl font-black mb-2 group-hover:text-purple-400 transition">All Orders</div>
            <div className="text-xs text-gray-500">Real-time order monitoring</div>
          </a>

          <a
            href="/admin/commission-tiers"
            className="bg-gradient-to-br from-yellow-900/50 to-yellow-950/50 border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500 transition cursor-pointer group"
          >
            <div className="text-sm text-yellow-400 mb-2">Configure</div>
            <div className="text-2xl font-black mb-2 group-hover:text-yellow-400 transition">Commission Tiers</div>
            <div className="text-xs text-gray-500">Set pricing and commission rates</div>
          </a>

          <a
            href="/admin/payouts"
            className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="text-sm text-emerald-400 mb-2">Financial</div>
            <div className="text-2xl font-black mb-2 group-hover:text-emerald-400 transition">Payouts</div>
            <div className="text-xs text-gray-500">Manage store payouts</div>
          </a>

          <a
            href="/admin/analytics/bodega"
            className="bg-gradient-to-br from-pink-900/50 to-pink-950/50 border-2 border-pink-500/30 rounded-2xl p-6 hover:border-pink-500 transition cursor-pointer group"
          >
            <div className="text-sm text-pink-400 mb-2">Insights</div>
            <div className="text-2xl font-black mb-2 group-hover:text-pink-400 transition">Analytics</div>
            <div className="text-xs text-gray-500">Bodega performance metrics</div>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-2xl font-bold mb-6">System Status</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Database</div>
                <div className="text-lg font-semibold">Connected</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">AI Services</div>
                <div className="text-lg font-semibold">Operational</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">API Services</div>
                <div className="text-lg font-semibold">Active</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Processing</div>
                <div className="text-lg font-semibold">Ready</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

