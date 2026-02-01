import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PayoutsClient from './PayoutsClient'

export const metadata = {
  title: 'Payouts - Store Portal - Julyu',
  description: 'Manage your payout settings and view earnings',
}

export default async function PayoutsPage() {
  const { storeOwner } = await getStoreOwnerAnyStatus()

  if (!storeOwner) {
    redirect('/store-portal')
  }

  const supabase = await createServerClient()

  // Get payout history
  const { data: payouts } = await supabase
    .from('store_payouts')
    .select('*')
    .eq('store_owner_id', storeOwner.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get completed orders for earnings summary
  const { data: completedOrders } = await supabase
    .from('bodega_orders')
    .select('total_amount, store_payout, delivery_fee, completed_at')
    .eq('store_owner_id', storeOwner.id)
    .eq('status', 'delivered')
    .order('completed_at', { ascending: false })

  const allOrders = completedOrders || []

  // Calculate earnings
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthOrders = allOrders.filter((o: any) => new Date(o.completed_at) >= thisMonthStart)
  const lastMonthOrders = allOrders.filter((o: any) => {
    const date = new Date(o.completed_at)
    return date >= lastMonthStart && date <= lastMonthEnd
  })

  const calculateEarnings = (orders: any[]) => {
    return orders.reduce((sum, o) => sum + parseFloat(o.store_payout || 0), 0)
  }

  const totalEarnings = calculateEarnings(allOrders)
  const thisMonthEarnings = calculateEarnings(thisMonthOrders)
  const lastMonthEarnings = calculateEarnings(lastMonthOrders)

  // Pending payout (orders not yet paid out)
  const paidOutOrderIds = (payouts || []).flatMap((p: any) => p.order_ids || [])
  const pendingOrders = allOrders.filter((o: any) => !paidOutOrderIds.includes(o.id))
  const pendingPayout = calculateEarnings(pendingOrders)

  const stripeConnected = !!storeOwner.stripe_account_id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href="/store-portal/settings"
              className="text-sm hover:text-green-500 transition flex items-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payouts</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your payment settings and view earnings
          </p>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pending Payout</p>
              <p className="text-2xl font-bold mt-1 text-green-500">
                ${pendingPayout.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {pendingOrders.length} orders
              </p>
            </div>
            <div className="bg-green-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>This Month</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${thisMonthEarnings.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {thisMonthOrders.length} orders
              </p>
            </div>
            <div className="bg-blue-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Last Month</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${lastMonthEarnings.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {lastMonthOrders.length} orders
              </p>
            </div>
            <div className="bg-purple-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All Time</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {allOrders.length} total orders
              </p>
            </div>
            <div className="bg-yellow-500/15 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Connect Section */}
      <PayoutsClient
        stripeConnected={stripeConnected}
        stripeAccountId={storeOwner.stripe_account_id}
        businessEmail={storeOwner.business_email}
        payouts={payouts || []}
      />

      {/* Commission Info */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>About Payouts</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Payouts are processed weekly on Fridays for all completed orders from the previous week.
              Your commission rate is <strong>{storeOwner.commission_rate || 15}%</strong>.
              Funds typically arrive in your bank account within 2-3 business days after processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

