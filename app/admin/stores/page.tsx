import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = {
  title: 'All Stores - Admin - Julyu',
  description: 'Manage all store owners',
}

export default async function AllStoresPage() {
  const supabase = await createServerClient()

  // Get all store owners with their stores
  const { data: storeOwners, error } = await supabase
    .from('store_owners')
    .select(`
      *,
      bodega_stores (
        id,
        name,
        city,
        state,
        zip,
        is_active,
        verified
      )
    `)
    .order('created_at', { ascending: false })

  const allStores = storeOwners || []

  // Stats
  const totalStores = allStores.length
  const approvedStores = allStores.filter((s: any) => s.application_status === 'approved').length
  const pendingStores = allStores.filter((s: any) => s.application_status === 'pending').length
  const activeStores = allStores.filter((s: any) => s.application_status === 'approved' && s.accepts_orders).length

  // Calculate total locations
  const totalLocations = allStores.reduce((sum: number, owner: any) => sum + (owner.bodega_stores?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Stores</h1>
          <p className="text-gray-600 mt-1">
            Manage all store owners and locations
          </p>
        </div>
        <Link
          href="/admin/stores/applications"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          View Applications
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Stores</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalStores}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {approvedStores}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingStores}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {activeStores}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Locations</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {totalLocations}
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepting Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allStores.map((store: any) => {
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-100 text-yellow-800',
                  under_review: 'bg-blue-100 text-blue-800',
                  approved: 'bg-green-100 text-green-800',
                  rejected: 'bg-red-100 text-red-800',
                  suspended: 'bg-gray-100 text-gray-800',
                }

                return (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {store.business_name}
                      </div>
                      {store.business_email && (
                        <div className="text-sm text-gray-500">{store.business_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {store.business_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {store.bodega_stores?.length || 0} location(s)
                      </div>
                      {store.bodega_stores && store.bodega_stores.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {store.bodega_stores[0].name}
                          {store.bodega_stores.length > 1 && ` +${store.bodega_stores.length - 1} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[store.application_status]}`}>
                        {store.application_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {store.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.accepts_orders ? (
                        <span className="text-green-600 text-sm">Yes</span>
                      ) : (
                        <span className="text-red-600 text-sm">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(store.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {allStores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No stores found</p>
          </div>
        )}
      </div>
    </div>
  )
}
