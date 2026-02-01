import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrderCard from '@/components/store-portal/OrderCard'

export const metadata = {
  title: 'Orders - Store Portal - Julyu',
  description: 'Manage customer orders',
}

export default async function OrdersPage() {
  // Layout already verifies store owner is approved
  // Just get the store owner data without redirects
  const { storeOwner } = await getStoreOwner()

  // If no store owner (edge case), redirect to main store portal
  // Layout will handle showing appropriate content
  if (!storeOwner) {
    redirect('/store-portal')
  }

  const supabase = await createServerClient()

  // Get orders for this store owner
  const { data: orders, error: ordersError } = await supabase
    .from('bodega_orders')
    .select('*')
    .eq('store_owner_id', storeOwner.id)
    .order('ordered_at', { ascending: false })

  const allOrders = orders || []

  // Separate orders by status
  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending')
  const activeOrders = allOrders.filter((o: any) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
  const completedOrders = allOrders.filter((o: any) => o.status === 'delivered')
  const cancelledOrders = allOrders.filter((o: any) => o.status === 'cancelled')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage and fulfill customer orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending</div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">
            {pendingOrders.length}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Active</div>
          <div className="text-2xl font-bold text-blue-500 mt-1">
            {activeOrders.length}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Completed</div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {completedOrders.length}
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Orders</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {allOrders.length}
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Pending Orders ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Active Orders ({activeOrders.length})
          </h2>
          <div className="space-y-4">
            {activeOrders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Completed Orders ({completedOrders.length})
          </h2>
          <div className="space-y-4">
            {completedOrders.slice(0, 5).map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          {completedOrders.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-sm text-green-500 hover:text-green-400">
                View all {completedOrders.length} completed orders
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Orders */}
      {allOrders.length === 0 && (
        <div className="rounded-lg p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <svg className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No orders yet</h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Orders from customers will appear here. Make sure your inventory is up to date!
          </p>
          <Link
            href="/store-portal/inventory"
            className="inline-block px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
          >
            Manage Inventory
          </Link>
        </div>
      )}
    </div>
  )
}
