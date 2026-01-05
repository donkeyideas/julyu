'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserStats {
  total: number
  premium: number
  enterprise: number
  free: number
}

export default function UsersPage() {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    premium: 0,
    enterprise: 0,
    free: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    try {
      const supabase = createClient()

      const [totalResult, premiumResult, enterpriseResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'enterprise'),
      ])

      const total = totalResult.count || 0
      const premium = premiumResult.count || 0
      const enterprise = enterpriseResult.count || 0
      const free = total - premium - enterprise

      setStats({
        total,
        premium,
        enterprise,
        free,
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
      setStats({ total: 0, premium: 0, enterprise: 0, free: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading user stats...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">User Management</h1>
        <p className="text-gray-500 mt-2">View and manage user accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Users</div>
          <div className="text-5xl font-black text-green-500">{stats.total.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">All registered users</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Premium Users</div>
          <div className="text-5xl font-black">{stats.premium.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.total > 0 ? `${((stats.premium / stats.total) * 100).toFixed(1)}% of total` : '0% of total'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Enterprise Users</div>
          <div className="text-5xl font-black">{stats.enterprise.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.total > 0 ? `${((stats.enterprise / stats.total) * 100).toFixed(1)}% of total` : '0% of total'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Free Users</div>
          <div className="text-5xl font-black">{stats.free.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.total > 0 ? `${((stats.free / stats.total) * 100).toFixed(1)}% of total` : '0% of total'}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">User Distribution</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Premium</span>
              <span className="font-bold">{stats.premium}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full"
                style={{ width: `${stats.total > 0 ? (stats.premium / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Enterprise</span>
              <span className="font-bold">{stats.enterprise}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full"
                style={{ width: `${stats.total > 0 ? (stats.enterprise / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Free</span>
              <span className="font-bold">{stats.free}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gray-500 h-3 rounded-full"
                style={{ width: `${stats.total > 0 ? (stats.free / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


