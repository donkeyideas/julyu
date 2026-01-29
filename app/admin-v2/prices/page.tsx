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
        supabase.from('partner_retailers').select('*', { count: 'exact', head: true }),
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
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading price database...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }} style={{ color: 'var(--text-primary)' }}>Price Database</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage product prices and retailer data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Products</div>
          <div className="text-4xl font-black text-green-500">{stats.totalProducts.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Products in catalog</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Prices</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalPrices.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Price records</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Retailers</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.retailers.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Price sources</div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Last Updated</div>
          <div className="text-xl font-black">
            {stats.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleDateString()
              : '—'}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Most recent price update</div>
        </div>
      </div>

      <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Price Database Overview</h2>
        <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
          <p>
            The price database stores real-time pricing information from various retailers via the Instacart Connect API.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Data Sources</div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Instacart Connect API</li>
                <li>• Partner retailers</li>
                <li>• Manual price entries</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Database Tables</div>
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


