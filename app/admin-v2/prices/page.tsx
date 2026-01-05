'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PriceStats {
  totalProducts: number
  totalPrices: number
  retailers: number
  lastUpdated: string | null
}

export default function PricesPage() {
  const [stats, setStats] = useState<PriceStats>({
    totalProducts: 0,
    totalPrices: 0,
    retailers: 0,
    lastUpdated: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPriceStats()
  }, [])

  const loadPriceStats = async () => {
    try {
      const supabase = createClient()

      const [productsResult, pricesResult, retailersResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('prices').select('*', { count: 'exact', head: true }),
        supabase.from('retailers').select('*', { count: 'exact', head: true }),
      ])

      const totalProducts = productsResult.count || 0
      const totalPrices = pricesResult.count || 0
      const retailers = retailersResult.count || 0

      // Get last updated price
      const { data: lastPrice } = await supabase
        .from('prices')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()

      setStats({
        totalProducts,
        totalPrices,
        retailers,
        lastUpdated: lastPrice?.last_updated || null,
      })
    } catch (error) {
      console.error('Error loading price stats:', error)
      setStats({ totalProducts: 0, totalPrices: 0, retailers: 0, lastUpdated: null })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading price database...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Price Database</h1>
        <p className="text-gray-500 mt-2">Manage product prices and retailer data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Products</div>
          <div className="text-4xl font-black text-green-500">{stats.totalProducts.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Products in catalog</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Prices</div>
          <div className="text-4xl font-black">{stats.totalPrices.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Price records</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Retailers</div>
          <div className="text-4xl font-black">{stats.retailers.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">Price sources</div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Last Updated</div>
          <div className="text-xl font-black">
            {stats.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleDateString()
              : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Most recent price update</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Price Database Overview</h2>
        <div className="space-y-4 text-gray-400">
          <p>
            The price database stores real-time pricing information from various retailers via the Instacart Connect API.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <div className="text-sm font-semibold text-white mb-2">Data Sources</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Instacart Connect API</li>
                <li>• Partner retailers</li>
                <li>• Manual price entries</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-2">Database Tables</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• products - Product catalog</li>
                <li>• prices - Price history</li>
                <li>• retailers - Retailer info</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


