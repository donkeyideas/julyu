'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UsersPage() {
  const [stats, setStats] = useState({ total: 0, premium: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient()

        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        const { count: premiumUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_tier', 'premium')

        setStats({
          total: totalUsers || 0,
          premium: premiumUsers || 0,
        })
      } catch (error) {
        // Using test auth - return 0
        setStats({ total: 0, premium: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

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
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Total Users</div>
          <div className="text-5xl font-black">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Premium Users</div>
          <div className="text-5xl font-black">{stats.premium.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

