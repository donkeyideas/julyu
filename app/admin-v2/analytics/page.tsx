'use client'

import { useEffect, useState } from 'react'

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Format currency with commas
const formatCurrency = (num: number): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function BodegaAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStores: 0,
    totalLocations: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalStorePayout: 0,
    averageOrderValue: 0,
    averageCommissionRate: 0,
    totalInventoryItems: 0,
    ordersByStatus: {
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    },
    deliveryOrders: 0,
    pickupOrders: 0,
    recentOrders: 0,
    recentRevenue: 0,
    storePerformance: [] as any[],
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      // Fetch stores from API (same as All Stores page)
      const storesResponse = await fetch('/api/admin/stores/manage')
      const storesData = storesResponse.ok ? await storesResponse.json() : { stores: [] }
      const allStores = storesData.stores || []

      // Fetch orders from API
      const ordersResponse = await fetch('/api/admin/bodega-orders')
      const ordersData = ordersResponse.ok ? await ordersResponse.json() : { orders: [] }
      const allOrders = ordersData.orders || []

      // Fetch inventory count from API
      const inventoryResponse = await fetch('/api/admin/inventory/count')
      const inventoryData = inventoryResponse.ok ? await inventoryResponse.json() : { count: 0 }
      const totalInventoryItems = inventoryData.count || 0

      // Calculate metrics
      const totalStores = allStores.filter((s: any) => s.application_status === 'approved').length
      const totalLocations = allStores.reduce((sum: number, s: any) => sum + (s.bodega_stores?.length || 0), 0)
      const totalOrders = allOrders.length
      const completedOrders = allOrders.filter((o: any) => o.status === 'delivered').length

      const totalRevenue = allOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0)

      const totalCommission = allOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => {
          const orderTotal = parseFloat(o.total_amount || '0')
          const storePayout = parseFloat(o.store_payout || '0')
          const deliveryFee = parseFloat(o.delivery_fee || '0')
          return sum + (orderTotal - storePayout - deliveryFee)
        }, 0)

      const totalStorePayout = allOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + parseFloat(o.store_payout || '0'), 0)

      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
      const averageCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

      // Top performing stores
      const storePerformance = allStores
        .filter((s: any) => s.application_status === 'approved')
        .map((store: any) => {
          const storeOrders = allOrders.filter((o: any) => o.store_owner_id === store.id && o.status === 'delivered')
          const revenue = storeOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0)
          return {
            id: store.id,
            name: store.business_name,
            orderCount: storeOrders.length,
            revenue,
            commission: store.commission_rate,
          }
        })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10)

      // Orders by status
      const ordersByStatus = {
        pending: allOrders.filter((o: any) => o.status === 'pending').length,
        accepted: allOrders.filter((o: any) => o.status === 'accepted').length,
        preparing: allOrders.filter((o: any) => o.status === 'preparing').length,
        ready: allOrders.filter((o: any) => o.status === 'ready').length,
        out_for_delivery: allOrders.filter((o: any) => o.status === 'out_for_delivery').length,
        delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
        cancelled: allOrders.filter((o: any) => o.status === 'cancelled').length,
      }

      // Delivery method breakdown
      const deliveryOrders = allOrders.filter((o: any) => o.delivery_method === 'delivery').length
      const pickupOrders = allOrders.filter((o: any) => o.delivery_method === 'pickup').length

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentOrders = allOrders.filter((o: any) => new Date(o.ordered_at) >= sevenDaysAgo)
      const recentRevenue = recentOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || '0'), 0)

      setStats({
        totalStores,
        totalLocations,
        totalOrders,
        completedOrders,
        totalRevenue,
        totalCommission,
        totalStorePayout,
        averageOrderValue,
        averageCommissionRate,
        totalInventoryItems,
        ordersByStatus,
        deliveryOrders,
        pickupOrders,
        recentOrders: recentOrders.length,
        recentRevenue,
        storePerformance,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: '#10b981' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Bodega Analytics</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Performance metrics and insights for the bodega system
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Active Stores</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(stats.totalStores)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {formatNumber(stats.totalLocations)} total locations
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Orders</div>
          <div className="text-4xl font-black text-blue-500">
            {formatNumber(stats.totalOrders)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {formatNumber(stats.completedOrders)} completed
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Revenue</div>
          <div className="text-4xl font-black text-green-500">
            ${formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            ${formatCurrency(stats.averageOrderValue)} avg order
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Commission</div>
          <div className="text-4xl font-black text-purple-500">
            ${formatCurrency(stats.totalCommission)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {stats.averageCommissionRate.toFixed(1)}% avg rate
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Financial Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Total Revenue</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${formatCurrency(stats.totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Commission Earned (Julyu)</span>
            <span className="text-sm text-green-500">${formatCurrency(stats.totalCommission)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Store Payouts</span>
            <span className="text-sm text-blue-500">${formatCurrency(stats.totalStorePayout)}</span>
          </div>
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Commission Rate</span>
            <span className="text-sm font-bold text-purple-500">{stats.averageCommissionRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Last 7 Days</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(stats.recentOrders)} orders
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            ${formatCurrency(stats.recentRevenue)} revenue
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Inventory Items</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(stats.totalInventoryItems)}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Across all stores
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Success Rate</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Orders completed successfully
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Order Status Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-4xl font-black text-yellow-500">{formatNumber(stats.ordersByStatus.pending)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pending</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-blue-500">
              {formatNumber(stats.ordersByStatus.accepted + stats.ordersByStatus.preparing + stats.ordersByStatus.ready)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-cyan-500">{formatNumber(stats.ordersByStatus.out_for_delivery)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Out for Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-green-500">{formatNumber(stats.ordersByStatus.delivered)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Delivered</div>
          </div>
        </div>
        {stats.ordersByStatus.cancelled > 0 && (
          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="text-4xl font-black text-red-500">{formatNumber(stats.ordersByStatus.cancelled)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Cancelled</div>
          </div>
        )}
      </div>

      {/* Delivery Method */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Delivery Method Breakdown</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-4xl font-black text-blue-500">{formatNumber(stats.deliveryOrders)}</div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-primary)' }}>Delivery Orders</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats.totalOrders > 0 ? ((stats.deliveryOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-green-500">{formatNumber(stats.pickupOrders)}</div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-primary)' }}>Pickup Orders</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats.totalOrders > 0 ? ((stats.pickupOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Stores */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Top Performing Stores</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  Store Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  Commission Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.storePerformance.map((store: any, index: number) => (
                <tr key={store.id} className="hover:opacity-80 transition" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    #{index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                    {store.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatNumber(store.orderCount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-500">
                    ${formatCurrency(store.revenue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {store.commission}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.storePerformance.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No store performance data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
