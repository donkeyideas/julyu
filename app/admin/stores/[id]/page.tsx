'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StoreDetailsForm from '@/components/admin/StoreDetailsForm'
import StoreLocationCard from '@/components/admin/StoreLocationCard'

interface StoreOwner {
  id: string
  business_name: string
  business_type: string
  business_email: string
  business_phone: string
  business_address: string
  tax_id: string
  business_license: string
  application_status: string
  commission_rate: number
  accepts_orders: boolean
  stripe_account_id: string | null
  stripe_account_status: string | null
  rejection_reason: string | null
  bodega_stores?: Array<{
    id: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    is_active: boolean
    verified: boolean
    latitude?: number
    longitude?: number
  }>
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  status: string
  total_amount: string
  store_payout: string
  ordered_at: string
}

export default function StoreDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [inventoryCount, setInventoryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        console.log('[Store Details] Fetching store:', id)
        const response = await fetch(`/api/admin/stores/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            console.log('[Store Details] Store not found, redirecting...')
            router.push('/admin/stores')
            return
          }
          throw new Error('Failed to fetch store details')
        }

        const data = await response.json()
        console.log('[Store Details] Loaded:', data.storeOwner?.business_name)
        setStoreOwner(data.storeOwner)
        setOrders(data.orders || [])
        setInventoryCount(data.inventoryCount || 0)
      } catch (err) {
        console.error('[Store Details] Error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchStoreDetails()
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: '#10b981' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading store details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-red-500 text-xl mb-4">Error loading store</div>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link
            href="/admin/stores"
            className="inline-block mt-4 px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            Back to All Stores
          </Link>
        </div>
      </div>
    )
  }

  if (!storeOwner) {
    return null
  }

  // Calculate stats
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0)
  const totalPayout = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.store_payout || '0'), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-500',
    under_review: 'bg-blue-500/15 text-blue-500',
    approved: 'bg-green-500/15 text-green-500',
    rejected: 'bg-red-500/15 text-red-500',
    suspended: 'bg-gray-500/15 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/stores"
            className="text-sm text-green-500 hover:text-green-400 mb-2 inline-block font-semibold"
          >
            ← Back to All Stores
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{storeOwner.business_name}</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Store ID: {storeOwner.id}
          </p>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${statusColors[storeOwner.application_status]}`}>
          {storeOwner.application_status.replace('_', ' ')}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Orders</div>
          <div className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {totalOrders}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed Orders</div>
          <div className="text-3xl font-bold text-green-500 mt-1">
            {completedOrders}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Revenue</div>
          <div className="text-3xl font-bold text-blue-500 mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Store Payout</div>
          <div className="text-3xl font-bold text-purple-500 mt-1">
            ${totalPayout.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Store Details Form */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
        <StoreDetailsForm storeOwner={storeOwner} />
      </div>

      {/* Locations */}
      {storeOwner.bodega_stores && storeOwner.bodega_stores.length > 0 && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Locations ({storeOwner.bodega_stores.length})
          </h2>
          <div className="space-y-4">
            {storeOwner.bodega_stores.map((location) => (
              <StoreLocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      )}

      {/* Inventory Summary */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Inventory</h2>
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {inventoryCount} items
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Total products across all locations
        </p>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent Orders ({orders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Ordered
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize text-sm" style={{ color: 'var(--text-primary)' }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.ordered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
