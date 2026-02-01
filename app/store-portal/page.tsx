'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  storeOwner: any
  primaryStore: any
  inventoryCount: number
  totalOrders: number
  pendingOrders: number
  todayRevenue: number
  recentOrders: any[]
}

export default function StorePortalDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/store-portal/dashboard')
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to load dashboard')
          return
        }

        setData(result.data)
      } catch (err) {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </div>
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-red-500 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { storeOwner, primaryStore, inventoryCount, totalOrders, pendingOrders, todayRevenue, recentOrders } = data

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {storeOwner.business_name}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {primaryStore?.name} • {primaryStore?.city}, {primaryStore?.state}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Products</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {inventoryCount}
              </p>
            </div>
            <div className="bg-blue-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/inventory"
            className="text-sm text-green-500 hover:text-green-400 mt-3 inline-block"
          >
            Manage Inventory →
          </Link>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Orders</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {pendingOrders}
              </p>
            </div>
            <div className="bg-yellow-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/orders"
            className="text-sm text-green-500 hover:text-green-400 mt-3 inline-block"
          >
            View Orders →
          </Link>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Orders</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {totalOrders}
              </p>
            </div>
            <div className="bg-green-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/analytics"
            className="text-sm text-green-500 hover:text-green-400 mt-3 inline-block"
          >
            View Analytics →
          </Link>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Today&apos;s Revenue</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${todayRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/settings/payouts"
            className="text-sm text-green-500 hover:text-green-400 mt-3 inline-block"
          >
            View Payouts →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/store-portal/inventory/add"
            className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-green-500 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <svg className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Add Products</span>
          </Link>

          <Link
            href="/store-portal/inventory/import"
            className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-green-500 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <svg className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Import Receipt</span>
          </Link>

          <Link
            href="/store-portal/inventory/pos-sync"
            className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-green-500 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <svg className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sync POS</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
          <Link
            href="/store-portal/orders"
            className="text-sm text-green-500 hover:text-green-400"
          >
            View All →
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {new Date(order.ordered_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-500/15 text-green-500' :
                    order.status === 'pending' ? 'bg-yellow-500/15 text-yellow-500' :
                    'bg-blue-500/15 text-blue-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <svg className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No orders yet</p>
            <p className="text-sm mt-1">Orders from customers will appear here</p>
          </div>
        )}
      </div>

      {/* Store Status */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Store Status</h3>
            <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>
                <strong>Commission Rate:</strong> {storeOwner.commission_rate}%
              </p>
              <p className="mt-1">
                <strong>Accepting Orders:</strong> {storeOwner.accepts_orders ? 'Yes' : 'No'}
              </p>
              {!storeOwner.stripe_account_id && (
                <div className="mt-3 rounded-md p-3 bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-500">
                    <strong>Action Required:</strong> Set up Stripe Connect to receive payouts.
                  </p>
                  <Link
                    href="/store-portal/settings/payouts"
                    className="text-yellow-500 underline hover:text-yellow-400 mt-1 inline-block"
                  >
                    Set up payouts →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
