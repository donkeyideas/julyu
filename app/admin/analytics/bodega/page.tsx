import { createServerClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Bodega Analytics - Admin - Julyu',
  description: 'Bodega system performance analytics',
}

export default async function BodegaAnalyticsPage() {
  const supabase = await createServerClient()

  // Get all stores
  const { data: stores } = await supabase
    .from('store_owners')
    .select(`
      *,
      bodega_stores (*)
    `)

  const allStores = stores || []

  // Get all orders
  const { data: orders } = await supabase
    .from('bodega_orders')
    .select('*')
    .order('ordered_at', { ascending: false })

  const allOrders = orders || []

  // Get inventory count
  const { count: totalInventoryItems } = await supabase
    .from('bodega_inventory')
    .select('*', { count: 'exact', head: true })

  // Calculate metrics
  const totalStores = allStores.filter(s => s.application_status === 'approved').length
  const totalLocations = allStores.reduce((sum, s) => sum + (s.bodega_stores?.length || 0), 0)
  const totalOrders = allOrders.length
  const completedOrders = allOrders.filter(o => o.status === 'delivered').length

  const totalRevenue = allOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

  const totalCommission = allOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => {
      const orderTotal = parseFloat(o.total_amount)
      const storePayout = parseFloat(o.store_payout)
      const deliveryFee = parseFloat(o.delivery_fee)
      return sum + (orderTotal - storePayout - deliveryFee)
    }, 0)

  const totalStorePayout = allOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.store_payout), 0)

  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
  const averageCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

  // Top performing stores
  const storePerformance = allStores
    .filter(s => s.application_status === 'approved')
    .map(store => {
      const storeOrders = allOrders.filter(o => o.store_owner_id === store.id && o.status === 'delivered')
      const revenue = storeOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
      return {
        id: store.id,
        name: store.business_name,
        orderCount: storeOrders.length,
        revenue,
        commission: store.commission_rate,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Orders by status
  const ordersByStatus = {
    pending: allOrders.filter(o => o.status === 'pending').length,
    accepted: allOrders.filter(o => o.status === 'accepted').length,
    preparing: allOrders.filter(o => o.status === 'preparing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    out_for_delivery: allOrders.filter(o => o.status === 'out_for_delivery').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  }

  // Delivery method breakdown
  const deliveryOrders = allOrders.filter(o => o.delivery_method === 'delivery').length
  const pickupOrders = allOrders.filter(o => o.delivery_method === 'pickup').length

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentOrders = allOrders.filter(o => new Date(o.ordered_at) >= sevenDaysAgo)
  const recentRevenue = recentOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bodega Analytics</h1>
        <p className="text-gray-600 mt-1">
          Performance metrics and insights for the bodega system
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Active Stores</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalStores}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalLocations} total locations
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {totalOrders}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {completedOrders} completed
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${averageOrderValue.toFixed(2)} avg order
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Commission</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ${totalCommission.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {averageCommissionRate.toFixed(1)}% avg rate
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Revenue</span>
            <span className="text-sm font-bold text-gray-900">${totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Commission Earned (Julyu)</span>
            <span className="text-sm text-green-600">${totalCommission.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Store Payouts</span>
            <span className="text-sm text-blue-600">${totalStorePayout.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Commission Rate</span>
            <span className="text-sm font-bold text-purple-600">{averageCommissionRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Last 7 Days</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {recentOrders.length} orders
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${recentRevenue.toFixed(2)} revenue
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Inventory Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalInventoryItems || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Across all stores
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Success Rate</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Orders completed successfully
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{ordersByStatus.pending}</div>
            <div className="text-xs text-gray-600 mt-1">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{ordersByStatus.accepted + ordersByStatus.preparing + ordersByStatus.ready}</div>
            <div className="text-xs text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-600">{ordersByStatus.out_for_delivery}</div>
            <div className="text-xs text-gray-600 mt-1">Out for Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{ordersByStatus.delivered}</div>
            <div className="text-xs text-gray-600 mt-1">Delivered</div>
          </div>
        </div>
        {ordersByStatus.cancelled > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{ordersByStatus.cancelled}</div>
            <div className="text-xs text-gray-600 mt-1">Cancelled</div>
          </div>
        )}
      </div>

      {/* Delivery Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method Breakdown</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{deliveryOrders}</div>
            <div className="text-sm text-gray-600 mt-1">Delivery Orders</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalOrders > 0 ? ((deliveryOrders / totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{pickupOrders}</div>
            <div className="text-sm text-gray-600 mt-1">Pickup Orders</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalOrders > 0 ? ((pickupOrders / totalOrders) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Stores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Stores</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Store Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Orders
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storePerformance.map((store, index) => (
                <tr key={store.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {store.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {store.orderCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${store.revenue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {store.commission}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {storePerformance.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No store performance data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
