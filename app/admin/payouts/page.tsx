'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PayoutGeneratorForm from '@/components/admin/PayoutGeneratorForm'

export default function PayoutsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    loadPayouts()
  }, [])

  const loadPayouts = async () => {
    try {
      const supabase = createClient()

      // Verify admin access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/dashboard')
        return
      }

      // Get all payouts
      const { data: payoutsData } = await supabase
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

      setPayouts(payoutsData || [])
    } catch (error) {
      console.error('Error loading payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading payouts...</div>
        </div>
      </div>
    )
  }

  const allPayouts = payouts || []

  // Calculate stats
  const totalPayouts = allPayouts.length
  const pendingPayouts = allPayouts.filter((p: any) => p.status === 'pending').length
  const processingPayouts = allPayouts.filter((p: any) => p.status === 'processing').length
  const paidPayouts = allPayouts.filter((p: any) => p.status === 'paid').length
  const totalPaidAmount = allPayouts
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + parseFloat(p.net_payout), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500 text-black',
    processing: 'bg-blue-500 text-black',
    paid: 'bg-green-500 text-black',
    failed: 'bg-red-500 text-black',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Store Owner Payouts</h1>
          <p className="text-gray-500 mt-2">
            Generate and manage payouts to store owners
          </p>
        </div>
        <Link
          href="/admin/payouts/generate"
          className="px-6 py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition"
        >
          Generate Payouts
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Total Payouts</div>
          <div className="text-3xl font-black">
            {totalPayouts}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Pending</div>
          <div className="text-3xl font-black text-yellow-500">
            {pendingPayouts}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Processing</div>
          <div className="text-3xl font-black text-blue-500">
            {processingPayouts}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Paid</div>
          <div className="text-3xl font-black text-green-500">
            {paidPayouts}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Total Paid</div>
          <div className="text-3xl font-black text-green-500">
            ${totalPaidAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payout Generator */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-2xl font-black mb-4">Quick Payout Generator</h2>
        <PayoutGeneratorForm />
      </div>

      {/* Payouts Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-2xl font-black">Recent Payouts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Gross Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Net Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  Paid At
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {allPayouts.map((payout: any) => (
                <tr key={payout.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black">
                      {payout.store_owners?.business_name || 'Unknown'}
                    </div>
                    {payout.stripe_payout_id && (
                      <div className="text-xs text-gray-500 font-mono">
                        {payout.stripe_payout_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black">
                    {payout.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black">
                    ${parseFloat(payout.gross_revenue).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-purple-500">
                    ${parseFloat(payout.total_commissions).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-green-500">
                    ${parseFloat(payout.net_payout).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-black rounded-full ${statusColors[payout.status]}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
              className="mt-4 inline-block px-6 py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition"
            >
              Generate First Payout
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
