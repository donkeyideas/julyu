import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StoreDetailsForm from '@/components/admin/StoreDetailsForm'

export const metadata = {
  title: 'Store Details - Admin - Julyu',
  description: 'View and manage store details',
}

interface Props {
  params: {
    id: string
  }
}

export default async function StoreDetailsPage({ params }: Props) {
  const supabase = await createServerClient()

  // Get store owner details
  const { data: storeOwner, error } = await supabase
    .from('store_owners')
    .select(`
      *,
      bodega_stores (*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !storeOwner) {
    redirect('/admin/stores')
  }

  // Get recent orders for this store
  const { data: recentOrders } = await supabase
    .from('bodega_orders')
    .select('*')
    .eq('store_owner_id', params.id)
    .order('ordered_at', { ascending: false })
    .limit(10)

  const orders = recentOrders || []

  // Calculate stats
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
  const totalPayout = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.store_payout), 0)

  // Get inventory count
  const { count: inventoryCount } = await supabase
    .from('bodega_inventory')
    .select('*', { count: 'exact', head: true })
    .in('bodega_store_id', storeOwner.bodega_stores?.map((s: any) => s.id) || [])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/stores"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to All Stores
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{storeOwner.business_name}</h1>
          <p className="text-gray-600 mt-1">
            Store ID: {storeOwner.id}
          </p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[storeOwner.application_status]}`}>
          {storeOwner.application_status.replace('_', ' ')}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Completed Orders</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {completedOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Store Payout</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ${totalPayout.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Store Details Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
        <StoreDetailsForm storeOwner={storeOwner} />
      </div>

      {/* Locations */}
      {storeOwner.bodega_stores && storeOwner.bodega_stores.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Locations ({storeOwner.bodega_stores.length})
          </h2>
          <div className="space-y-4">
            {storeOwner.bodega_stores.map((location: any) => (
              <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {location.city}, {location.state} {location.zip}
                    </p>
                    {location.phone && (
                      <p className="text-sm text-gray-600 mt-1">
                        Phone: {location.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {location.is_active ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {location.verified ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
          <span className="text-2xl font-bold text-gray-900">
            {inventoryCount || 0} items
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Total products across all locations
        </p>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders ({orders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ordered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
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
