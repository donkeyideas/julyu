import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PayoutGeneratorForm from '@/components/admin/PayoutGeneratorForm'

export const metadata = {
  title: 'Payouts - Admin - Julyu',
  description: 'Manage store owner payouts',
}

export default async function PayoutsPage() {
  const supabase = await createServerClient()

  // Get all payouts
  const { data: payouts } = await supabase
    .from('store_payouts')
    .select(`
      *,
      store_owners (
        business_name,
        stripe_account_id
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const allPayouts = payouts || []

  // Calculate stats
  const totalPayouts = allPayouts.length
  const pendingPayouts = allPayouts.filter(p => p.status === 'pending').length
  const processingPayouts = allPayouts.filter(p => p.status === 'processing').length
  const paidPayouts = allPayouts.filter(p => p.status === 'paid').length
  const totalPaidAmount = allPayouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.net_payout), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Owner Payouts</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage payouts to store owners
          </p>
        </div>
        <Link
          href="/admin/payouts/generate"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Generate Payouts
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Payouts</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalPayouts}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingPayouts}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Processing</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {processingPayouts}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {paidPayouts}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Paid</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            ${totalPaidAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payout Generator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Payout Generator</h2>
        <PayoutGeneratorForm />
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payout.store_owners?.business_name || 'Unknown'}
                    </div>
                    {payout.stripe_payout_id && (
                      <div className="text-xs text-gray-500 font-mono">
                        {payout.stripe_payout_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payout.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(payout.gross_revenue).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(payout.total_commissions).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${parseFloat(payout.net_payout).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[payout.status]}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allPayouts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payouts yet</p>
            <Link
              href="/admin/payouts/generate"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Generate First Payout
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
