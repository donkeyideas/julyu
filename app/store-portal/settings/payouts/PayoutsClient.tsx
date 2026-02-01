'use client'

import { useState } from 'react'

interface Payout {
  id: string
  period_start: string
  period_end: string
  total_orders: number
  gross_revenue: number
  total_commissions: number
  net_payout: number
  status: string
  created_at: string
}

interface PayoutsClientProps {
  stripeConnected: boolean
  stripeAccountId?: string
  businessEmail?: string
  payouts: Payout[]
}

export default function PayoutsClient({
  stripeConnected,
  stripeAccountId,
  businessEmail,
  payouts,
}: PayoutsClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnectStripe = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/stripe-connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe account')
      }

      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/stripe-connect/dashboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access dashboard')
      }

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Stripe Connect Status */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className={`rounded-full p-3 ${stripeConnected ? 'bg-green-500/15' : 'bg-yellow-500/15'}`}>
              {stripeConnected ? (
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {stripeConnected ? 'Stripe Connected' : 'Connect Stripe to Receive Payouts'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {stripeConnected
                  ? 'Your Stripe account is connected and ready to receive payouts.'
                  : 'Connect your Stripe account to start receiving payouts for your orders.'}
              </p>
              {stripeConnected && stripeAccountId && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Account ID: {stripeAccountId.slice(0, 12)}...
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {stripeConnected ? (
              <button
                onClick={handleAccessDashboard}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'View Stripe Dashboard'}
              </button>
            ) : (
              <button
                onClick={handleConnectStripe}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Stripe'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Payout History</h2>
        </div>

        {payouts.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payout.status === 'completed'
                          ? 'bg-green-500/15 text-green-500'
                          : payout.status === 'processing'
                          ? 'bg-blue-500/15 text-blue-500'
                          : 'bg-yellow-500/15 text-yellow-500'
                      }`}
                    >
                      {payout.status}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {payout.total_orders} orders • Commission: ${payout.total_commissions?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-500">
                    ${payout.net_payout?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(payout.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No payouts yet
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {stripeConnected
                ? 'Payouts will appear here once your first payout is processed.'
                : 'Connect your Stripe account to start receiving payouts.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
