import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Orders - Admin - Julyu',
  description: 'Monitor all bodega orders',
}

export default async function AdminOrdersPage() {
  // Verify admin access
  const { isAdmin, error } = await verifyAdminAccess()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()

  // Fetch all orders with store and owner details
  const { data: orders, error: fetchError } = await supabase
    .from('bodega_orders')
    .select(`
      *,
      bodega_store:bodega_stores(name, address, city, state, zip),
      store_owner:store_owners(business_name, business_email)
    `)
    .order('ordered_at', { ascending: false })

  if (fetchError) {
    console.error('Fetch orders error:', fetchError)
  }

  const allOrders = orders || []

  // Calculate stats
  const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0)
  const totalCommission = allOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) - parseFloat(o.store_payout) - parseFloat(o.delivery_fee)), 0)
  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').length
  const activeOrders = allOrders.filter((o: any) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length
  const completedOrders = allOrders.filter((o: any) => o.status === 'delivered').length

  // Group orders by status
  const ordersByStatus = {
    pending: allOrders.filter((o: any) => o.status === 'pending'),
    active: allOrders.filter((o: any) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)),
    completed: allOrders.filter((o: any) => o.status === 'delivered'),
    cancelled: allOrders.filter((o: any) => o.status === 'cancelled'),
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bodega Orders</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage all orders across the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allOrders.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {activeOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {completedOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Commission Earned</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ${totalCommission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order number, customer, or store..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="delivered">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">
            Export
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Order #</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Store</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Items</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Commission</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">
                      Orders will appear here once customers start ordering from bodegas
                    </p>
                  </td>
                </tr>
              ) : (
                allOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.bodega_store?.name || 'Unknown Store'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.store_owner?.business_name || 'Unknown Owner'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm font-medium text-purple-600">
                      ${(parseFloat(order.total_amount) - parseFloat(order.store_payout) - parseFloat(order.delivery_fee)).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(order.ordered_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Breakdown */}
      {allOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-gray-900">{ordersByStatus.pending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-medium text-gray-900">{ordersByStatus.active.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-gray-900">{ordersByStatus.completed.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="text-sm font-medium text-gray-900">{ordersByStatus.cancelled.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-sm font-medium text-gray-900">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Commission Earned</span>
                <span className="text-sm font-medium text-purple-600">${totalCommission.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Store Payouts</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(totalRevenue - totalCommission - allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.delivery_fee), 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Order Value</span>
                <span className="text-sm font-medium text-gray-900">
                  ${allOrders.length > 0 ? (totalRevenue / allOrders.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
