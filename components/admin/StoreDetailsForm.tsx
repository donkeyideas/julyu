'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StoreOwner {
  id: string
  business_name: string
  business_type: string
  business_email: string
  business_phone: string
  business_address: string
  tax_id: string
  business_license: string
  application_status: string
  commission_rate: number
  accepts_orders: boolean
  stripe_account_id: string | null
  stripe_account_status: string | null
  rejection_reason: string | null
}

interface Props {
  storeOwner: StoreOwner
}

export default function StoreDetailsForm({ storeOwner }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [commissionRate, setCommissionRate] = useState(storeOwner.commission_rate.toString())
  const [acceptsOrders, setAcceptsOrders] = useState(storeOwner.accepts_orders)

  const handleUpdateCommission = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/store-owners/${storeOwner.id}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission_rate: parseFloat(commissionRate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update commission rate')
      }

      setSuccess('Commission rate updated successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOrders = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/store-owners/${storeOwner.id}/toggle-orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accepts_orders: !acceptsOrders,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order acceptance')
      }

      setAcceptsOrders(!acceptsOrders)
      setSuccess(`Store ${!acceptsOrders ? 'now accepts' : 'no longer accepts'} orders`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this store? They will not be able to accept orders.')) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/store-applications/${storeOwner.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend store')
      }

      setSuccess('Store suspended successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to reactivate this store?')) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/store-applications/${storeOwner.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate store')
      }

      setSuccess('Store reactivated successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-lg p-3">
          <p className="text-sm text-green-500">{success}</p>
        </div>
      )}

      {/* Business Info (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business Name
          </label>
          <input
            type="text"
            value={storeOwner.business_name}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business Type
          </label>
          <input
            type="text"
            value={storeOwner.business_type}
            disabled
            className="w-full px-3 py-2 rounded-lg capitalize opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business Email
          </label>
          <input
            type="email"
            value={storeOwner.business_email || 'N/A'}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business Phone
          </label>
          <input
            type="tel"
            value={storeOwner.business_phone || 'N/A'}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business Address
          </label>
          <input
            type="text"
            value={storeOwner.business_address || 'N/A'}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Tax ID
          </label>
          <input
            type="text"
            value={storeOwner.tax_id || 'N/A'}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Business License
          </label>
          <input
            type="text"
            value={storeOwner.business_license || 'N/A'}
            disabled
            className="w-full px-3 py-2 rounded-lg opacity-75"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      {/* Stripe Connect Info */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Stripe Connect</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Account ID
            </label>
            <input
              type="text"
              value={storeOwner.stripe_account_id || 'Not connected'}
              disabled
              className="w-full px-3 py-2 rounded-lg font-mono text-xs opacity-75"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Account Status
            </label>
            <input
              type="text"
              value={storeOwner.stripe_account_status || 'N/A'}
              disabled
              className="w-full px-3 py-2 rounded-lg capitalize opacity-75"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>
      </div>

      {/* Commission Rate (Editable) */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Commission Settings</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <button
            onClick={handleUpdateCommission}
            disabled={loading || commissionRate === storeOwner.commission_rate.toString()}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Update Rate
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Current: {storeOwner.commission_rate}% | New rate will apply to future orders only
        </p>
      </div>

      {/* Order Acceptance Toggle */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Order Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Accept Orders</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {acceptsOrders
                ? 'Store is currently accepting orders from customers'
                : 'Store is not accepting new orders'}
            </p>
          </div>
          <button
            onClick={handleToggleOrders}
            disabled={loading || storeOwner.application_status !== 'approved'}
            className={`px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition ${
              acceptsOrders
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-black hover:bg-green-600'
            }`}
          >
            {acceptsOrders ? 'Disable Orders' : 'Enable Orders'}
          </button>
        </div>
      </div>

      {/* Rejection Reason (if rejected) */}
      {storeOwner.application_status === 'rejected' && storeOwner.rejection_reason && (
        <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Rejection Reason</h3>
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-500">{storeOwner.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Store Actions */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Store Actions</h3>
        <div className="flex gap-3">
          {storeOwner.application_status === 'approved' && (
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Suspend Store
            </button>
          )}

          {storeOwner.application_status === 'suspended' && (
            <button
              onClick={handleReactivate}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Reactivate Store
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
