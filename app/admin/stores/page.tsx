'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface StoreOwner {
  id: string
  business_name: string
  business_type: string
  business_email?: string
  application_status: string
  commission_rate: number
  accepts_orders: boolean
  created_at: string
  bodega_stores?: Array<{
    id: string
    name: string
    city: string
    state: string
  }>
}

export default function AllStoresPage() {
  const [stores, setStores] = useState<StoreOwner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      // Use API route to fetch stores (bypasses RLS)
      const response = await fetch('/api/admin/stores')

      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      } else {
        console.error('Failed to fetch stores:', response.statusText)
        setStores([])
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const totalStores = stores.length
  const approvedStores = stores.filter(s => s.application_status === 'approved').length
  const pendingStores = stores.filter(s => s.application_status === 'pending').length
  const activeStores = stores.filter(s => s.application_status === 'approved' && s.accepts_orders).length
  const totalLocations = stores.reduce((sum, owner) => sum + (owner.bodega_stores?.length || 0), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-500',
    under_review: 'bg-blue-500/15 text-blue-500',
    approved: 'bg-green-500/15 text-green-500',
    rejected: 'bg-red-500/15 text-red-500',
    suspended: 'bg-gray-500/15 text-gray-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: '#10b981' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading stores...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>All Stores</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage all store owners and locations</p>
        </div>
        <Link
          href="/admin/stores/applications"
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          View Applications
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total Stores</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Approved</div>
          <div className="text-4xl font-black text-green-500">{approvedStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Pending</div>
          <div className="text-4xl font-black text-yellow-500">{pendingStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Active</div>
          <div className="text-4xl font-black text-blue-500">{activeStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total Locations</div>
          <div className="text-4xl font-black text-purple-500">{totalLocations}</div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderTop: '1px solid var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Business Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Locations
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Commission Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Accepting Orders
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
              {stores.map((store) => (
                <tr key={store.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{store.business_name}</div>
                    {store.business_email && (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{store.business_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {store.business_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{store.bodega_stores?.length || 0} location(s)</div>
                    {store.bodega_stores && store.bodega_stores.length > 0 && (
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {store.bodega_stores[0].name}
                        {store.bodega_stores.length > 1 && ` +${store.bodega_stores.length - 1} more`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[store.application_status]}`}>
                      {store.application_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                    {store.commission_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.accepts_orders ? (
                      <span className="text-green-500 text-sm font-semibold">Yes</span>
                    ) : (
                      <span className="text-red-500 text-sm font-semibold">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(store.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/stores/${store.id}`}
                      className="text-green-500 hover:text-green-400 font-semibold"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No stores found</p>
          </div>
        )}
      </div>
    </div>
  )
}
