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
        supabase.from('retailers').select('*', { count: 'exact', head: true }),
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
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Admin Dashboard v2</h1>
        <p className="text-gray-500 mt-2">Complete overview of your Julyu system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Users</div>
          <div className="text-4xl font-black text-green-500">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Registered users</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Retailers</div>
          <div className="text-4xl font-black">{stats.totalRetailers.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Active partnerships</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">AI Requests</div>
          <div className="text-4xl font-black">{stats.totalRequests.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Total API calls</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Cost</div>
          <div className="text-4xl font-black text-green-500">${stats.totalCost.toFixed(4)}</div>
          <div className="text-xs text-gray-500 mt-2">AI usage costs</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Active Models</div>
          <div className="text-4xl font-black">{stats.activeModels}</div>
          <div className="text-xs text-gray-500 mt-2">Configured AI models</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Avg Response Time</div>
          <div className="text-4xl font-black">{stats.avgResponseTime}ms</div>
          <div className="text-xs text-gray-500 mt-2">Across all models</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-10">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin-v2/ai-models"
            className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg hover:bg-blue-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1">Manage API Keys</div>
            <div className="text-sm text-gray-400">Configure and test AI model API keys</div>
          </a>
          <a
            href="/admin-v2/usage"
            className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg hover:bg-green-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1">View Usage & Costs</div>
            <div className="text-sm text-gray-400">Track API usage and costs</div>
          </a>
          <a
            href="/admin-v2/performance"
            className="p-4 bg-purple-500/10 border border-purple-500/50 rounded-lg hover:bg-purple-500/20 transition"
          >
            <div className="text-lg font-semibold mb-1">Performance Metrics</div>
            <div className="text-sm text-gray-400">View AI model performance</div>
          </a>
        </div>
      </div>
    </div>
  )
}


