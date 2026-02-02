'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import NotificationModal from '@/components/ui/NotificationModal'

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null)

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
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading orders...</div>
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

  const exportToExcel = () => {
    if (allOrders.length === 0) {
      setNotification({ message: 'No orders to export', type: 'info' })
      return
    }

    const exportData = allOrders.map((order: any) => ({
      'Order #': order.order_number,
      'Customer Name': order.customer_name || '',
      'Customer Email': order.customer_email || '',
      'Customer Phone': order.customer_phone || '',
      'Store': order.bodega_store?.name || 'Unknown',
      'Store Owner': order.store_owner?.business_name || 'Unknown',
      'Items': order.items?.length || 0,
      'Subtotal': parseFloat(order.subtotal || 0).toFixed(2),
      'Tax': parseFloat(order.tax_amount || 0).toFixed(2),
      'Delivery Fee': parseFloat(order.delivery_fee || 0).toFixed(2),
      'Total': parseFloat(order.total_amount || 0).toFixed(2),
      'Commission Rate': `${order.commission_rate || 0}%`,
      'Commission Amount': parseFloat(order.commission_amount || 0).toFixed(2),
      'Store Payout': parseFloat(order.store_payout || 0).toFixed(2),
      'Status': statusLabels[order.status] || order.status,
      'Delivery Method': order.delivery_method || '',
      'Delivery Address': order.delivery_address || '',
      'Order Date': new Date(order.ordered_at).toLocaleString(),
      'Accepted At': order.accepted_at ? new Date(order.accepted_at).toLocaleString() : '',
      'Completed At': order.completed_at ? new Date(order.completed_at).toLocaleString() : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

    // Auto-size columns
    const maxWidth = 30
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row] || '').length)))
    }))
    worksheet['!cols'] = colWidths

    const fileName = `julyu-orders-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="space-y-6">
      {notification && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Bodega Orders</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Monitor and manage all orders across the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Orders</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {allOrders.length}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Pending</div>
          <div className="text-4xl font-black text-yellow-500">
            {pendingOrders}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Active</div>
          <div className="text-4xl font-black text-blue-500">
            {activeOrders}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Completed</div>
          <div className="text-4xl font-black text-green-500">
            {completedOrders}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Commission Earned</div>
          <div className="text-4xl font-black text-purple-500">
            ${totalCommission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order number, customer, or store..."
              className="w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <select className="px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="delivered">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={exportToExcel}
            className="px-6 py-2 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition"
          >
            Export
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderTop: '1px solid var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Order #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Store</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Items</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Commission</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
              {allOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{order.order_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</div>
                    {order.customer_email && (
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{order.customer_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {order.bodega_store?.name || 'Unknown Store'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {order.store_owner?.business_name || 'Unknown Owner'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(order.ordered_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin-v2/orders/${order.id}`}
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
            <p style={{ color: 'var(--text-secondary)' }}>No orders found</p>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      {allOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Orders by Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{ordersByStatus.pending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{ordersByStatus.active.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{ordersByStatus.completed.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cancelled</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{ordersByStatus.cancelled.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Revenue</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Commission Earned</span>
                <span className="text-sm font-black text-purple-500">${totalCommission.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Store Payouts</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  ${(totalRevenue - totalCommission - allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.delivery_fee), 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Order Value</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
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
