import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard - Store Portal - Julyu',
  description: 'Store owner dashboard',
}

export default async function StorePortalDashboard() {
  const { storeOwner, error } = await getStoreOwner()

  if (error) {
    redirect('/store-portal/apply')
  }

  if (!storeOwner) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Get store owner's stores
  const { stores } = await getStoreOwnerStores(storeOwner.id)
  const primaryStore = stores[0]

  // Get inventory count
  const { count: inventoryCount } = await supabase
    .from('bodega_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('bodega_store_id', primaryStore?.id || '')

  // Get orders statistics
  const { data: orders } = await supabase
    .from('bodega_orders')
    .select('id, status, total_amount, ordered_at')
    .eq('store_owner_id', storeOwner.id)
    .order('ordered_at', { ascending: false })
    .limit(10)

  const totalOrders = orders?.length || 0
  const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'accepted').length || 0
  const todayRevenue = orders?.reduce((sum: number, o: any) => {
    const orderDate = new Date(o.ordered_at)
    const today = new Date()
    if (orderDate.toDateString() === today.toDateString()) {
      return sum + parseFloat(o.total_amount)
    }
    return sum
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {storeOwner.business_name}
        </h1>
        <p className="text-gray-600 mt-1">
          {primaryStore?.name} • {primaryStore?.city}, {primaryStore?.state}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inventoryCount || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/inventory"
            className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
          >
            Manage Inventory →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {pendingOrders}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/orders"
            className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
          >
            View Orders →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalOrders}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/analytics"
            className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
          >
            View Analytics →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${todayRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Link
            href="/store-portal/settings/payouts"
            className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
          >
            View Payouts →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/store-portal/inventory/add"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Add Products</span>
          </Link>

          <Link
            href="/store-portal/inventory/import"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Import Receipt</span>
          </Link>

          <Link
            href="/store-portal/inventory/pos-sync"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Sync POS</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            href="/store-portal/orders"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All →
          </Link>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.ordered_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold text-gray-900">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No orders yet</p>
            <p className="text-sm mt-1">Orders from customers will appear here</p>
          </div>
        )}
      </div>

      {/* Store Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-900">Store Status</h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                <strong>Commission Rate:</strong> {storeOwner.commission_rate}%
              </p>
              <p className="mt-1">
                <strong>Accepting Orders:</strong> {storeOwner.accepts_orders ? 'Yes' : 'No'}
              </p>
              {!storeOwner.stripe_account_id && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800">
                    <strong>Action Required:</strong> Set up Stripe Connect to receive payouts.
                  </p>
                  <Link
                    href="/store-portal/settings/payouts"
                    className="text-yellow-900 underline hover:text-yellow-700 mt-1 inline-block"
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
