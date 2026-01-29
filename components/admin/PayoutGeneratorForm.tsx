'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PayoutGeneratorForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [period, setPeriod] = useState<'week' | 'biweekly' | 'month' | 'custom'>('week')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let periodStart: Date
      let periodEnd: Date

      if (period === 'custom') {
        if (!startDate || !endDate) {
          throw new Error('Please select start and end dates')
        }
        periodStart = new Date(startDate)
        periodEnd = new Date(endDate)
      } else {
        // Calculate period based on selection
        periodEnd = new Date()
        periodEnd.setHours(23, 59, 59, 999)

        periodStart = new Date()
        switch (period) {
          case 'week':
            periodStart.setDate(periodStart.getDate() - 7)
            break
          case 'biweekly':
            periodStart.setDate(periodStart.getDate() - 14)
            break
          case 'month':
            periodStart.setMonth(periodStart.getMonth() - 1)
            break
        }
        periodStart.setHours(0, 0, 0, 0)
      }

      const response = await fetch('/api/admin/payouts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate payouts')
      }

      setSuccess(`Successfully generated ${data.payoutsCreated} payout(s) totaling $${data.totalAmount.toFixed(2)}`)

      // Refresh page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Payout Period
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="week">Last Week</option>
            <option value="biweekly">Last 2 Weeks</option>
            <option value="month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {period === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          This will generate payouts for all stores with completed orders in the selected period.
          Payouts will be automatically sent via Stripe Connect to each store owner&apos;s bank account.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Generating...' : 'Generate Payouts'}
      </button>
    </form>
  )
}
