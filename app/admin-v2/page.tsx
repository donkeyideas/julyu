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

export default function AdminV2Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRetailers: 0,
    totalRequests: 0,
    totalCost: 0,
    activeModels: 0,
    avgResponseTime: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Load all stats
      const [usersResult, retailersResult, usageResult, configResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('partner_retailers').select('*', { count: 'exact', head: true }),
        supabase.from('ai_model_usage').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('ai_model_config').select('*').eq('is_active', true),
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

      {/* Bodega System Quick Access */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>🏪 Bodega System Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/stores/applications"
            className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500 transition cursor-pointer group"
          >
            <div className="text-sm text-blue-400 mb-2">Review & Approve</div>
            <div className="text-2xl font-black mb-2 group-hover:text-blue-400 transition" style={{ color: 'var(--text-primary)' }}>Store Applications</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage pending store applications</div>
          </a>

          <a
            href="/admin/stores"
            className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition cursor-pointer group"
          >
            <div className="text-sm text-green-400 mb-2">Manage</div>
            <div className="text-2xl font-black mb-2 group-hover:text-green-400 transition" style={{ color: 'var(--text-primary)' }}>All Stores</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>View and edit all bodega stores</div>
          </a>

          <a
            href="/admin/orders"
            className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-500 transition cursor-pointer group"
          >
            <div className="text-sm text-purple-400 mb-2">Monitor</div>
            <div className="text-2xl font-black mb-2 group-hover:text-purple-400 transition" style={{ color: 'var(--text-primary)' }}>All Orders</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time order monitoring</div>
          </a>

          <a
            href="/admin/commission-tiers"
            className="bg-gradient-to-br from-yellow-900/50 to-yellow-950/50 border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500 transition cursor-pointer group"
          >
            <div className="text-sm text-yellow-400 mb-2">Configure</div>
            <div className="text-2xl font-black mb-2 group-hover:text-yellow-400 transition" style={{ color: 'var(--text-primary)' }}>Commission Tiers</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Set pricing and commission rates</div>
          </a>

          <a
            href="/admin/payouts"
            className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="text-sm text-emerald-400 mb-2">Financial</div>
            <div className="text-2xl font-black mb-2 group-hover:text-emerald-400 transition" style={{ color: 'var(--text-primary)' }}>Payouts</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage store payouts</div>
          </a>

          <a
            href="/admin/analytics/bodega"
            className="bg-gradient-to-br from-pink-900/50 to-pink-950/50 border-2 border-pink-500/30 rounded-2xl p-6 hover:border-pink-500 transition cursor-pointer group"
          >
            <div className="text-sm text-pink-400 mb-2">Insights</div>
            <div className="text-2xl font-black mb-2 group-hover:text-pink-400 transition" style={{ color: 'var(--text-primary)' }}>Analytics</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bodega performance metrics</div>
          </a>
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


