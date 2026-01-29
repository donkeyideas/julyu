'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const supabase = createClient()


      // Fetch all orders with store and owner details
      const { data: ordersData, error: fetchError } = await supabase
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

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading orders...</div>
        </div>
      </div>
    )
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
    pending: 'bg-yellow-500/15 text-yellow-500',
    accepted: 'bg-blue-500/15 text-blue-500',
    preparing: 'bg-purple-500/15 text-purple-500',
    ready: 'bg-cyan-500/15 text-cyan-500',
    out_for_delivery: 'bg-purple-500/15 text-purple-500',
    delivered: 'bg-green-500/15 text-green-500',
    cancelled: 'bg-red-500/15 text-red-500',
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
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Bodega Orders</h1>
        <p className="text-gray-500 mt-2">
          Monitor and manage all orders across the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Orders</div>
          <div className="text-4xl font-black">
            {allOrders.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Pending</div>
          <div className="text-4xl font-black text-yellow-500">
            {pendingOrders}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Active</div>
          <div className="text-4xl font-black text-blue-500">
            {activeOrders}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Completed</div>
          <div className="text-4xl font-black text-green-500">
            {completedOrders}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Commission Earned</div>
          <div className="text-4xl font-black text-purple-500">
            ${totalCommission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order number, customer, or store..."
              className="w-full px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
          </div>
          <select className="px-4 py-2 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="delivered">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="px-6 py-2 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition">
            Export
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Store</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {allOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold">{order.order_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold">{order.customer_name}</div>
                    {order.customer_email && (
                      <div className="text-xs text-gray-500">{order.customer_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {order.bodega_store?.name || 'Unknown Store'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.store_owner?.business_name || 'Unknown Owner'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-500">
                    ${(parseFloat(order.total_amount) - parseFloat(order.store_payout) - parseFloat(order.delivery_fee)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.ordered_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/orders/${order.id}`}
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

        {allOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      {allOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-2xl font-black mb-4">Orders by Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending</span>
                <span className="text-sm font-black">{ordersByStatus.pending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active</span>
                <span className="text-sm font-black">{ordersByStatus.active.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Completed</span>
                <span className="text-sm font-black">{ordersByStatus.completed.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cancelled</span>
                <span className="text-sm font-black">{ordersByStatus.cancelled.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-2xl font-black mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Revenue</span>
                <span className="text-sm font-black">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Commission Earned</span>
                <span className="text-sm font-black text-purple-500">${totalCommission.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Store Payouts</span>
                <span className="text-sm font-black">
                  ${(totalRevenue - totalCommission - allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.delivery_fee), 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg Order Value</span>
                <span className="text-sm font-black">
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
