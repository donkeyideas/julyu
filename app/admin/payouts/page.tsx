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
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading payouts...</div>
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
    pending: 'bg-yellow-500/15 text-yellow-500',
    processing: 'bg-blue-500/15 text-blue-500',
    paid: 'bg-green-500/15 text-green-500',
    failed: 'bg-red-500/15 text-red-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Store Owner Payouts</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Generate and manage payouts to store owners
          </p>
        </div>
        <button className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition">
          Generate Payouts
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Payouts</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {totalPayouts}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Pending</div>
          <div className="text-4xl font-black text-yellow-500">
            {pendingPayouts}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Processing</div>
          <div className="text-4xl font-black text-blue-500">
            {processingPayouts}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Paid</div>
          <div className="text-4xl font-black text-green-500">
            {paidPayouts}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Paid</div>
          <div className="text-4xl font-black text-green-500">
            ${totalPaidAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Payout Generator */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Quick Payout Generator</h2>
        <PayoutGeneratorForm />
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderTop: '1px solid var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Store
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Orders
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Gross Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Commission
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Net Payout
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Paid At
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
              {allPayouts.map((payout: any) => (
                <tr key={payout.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {payout.store_owners?.business_name || 'Unknown'}
                    </div>
                    {payout.stripe_payout_id && (
                      <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {payout.stripe_payout_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {payout.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${parseFloat(payout.gross_revenue).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-500">
                    ${parseFloat(payout.total_commissions).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-500">
                    ${parseFloat(payout.net_payout).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[payout.status]}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allPayouts.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No payouts yet</p>
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
