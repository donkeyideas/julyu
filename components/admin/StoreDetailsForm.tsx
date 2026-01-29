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
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Business Info (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={storeOwner.business_name}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Type
          </label>
          <input
            type="text"
            value={storeOwner.business_type}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 capitalize"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Email
          </label>
          <input
            type="email"
            value={storeOwner.business_email || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Phone
          </label>
          <input
            type="tel"
            value={storeOwner.business_phone || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Address
          </label>
          <input
            type="text"
            value={storeOwner.business_address || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID
          </label>
          <input
            type="text"
            value={storeOwner.tax_id || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business License
          </label>
          <input
            type="text"
            value={storeOwner.business_license || 'N/A'}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
          />
        </div>
      </div>

      {/* Stripe Connect Info */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Stripe Connect</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              value={storeOwner.stripe_account_id || 'Not connected'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Status
            </label>
            <input
              type="text"
              value={storeOwner.stripe_account_status || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 capitalize"
            />
          </div>
        </div>
      </div>

      {/* Commission Rate (Editable) */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Commission Settings</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleUpdateCommission}
            disabled={loading || commissionRate === storeOwner.commission_rate.toString()}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Rate
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current: {storeOwner.commission_rate}% | New rate will apply to future orders only
        </p>
      </div>

      {/* Order Acceptance Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Accept Orders</p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptsOrders
                ? 'Store is currently accepting orders from customers'
                : 'Store is not accepting new orders'}
            </p>
          </div>
          <button
            onClick={handleToggleOrders}
            disabled={loading || storeOwner.application_status !== 'approved'}
            className={`px-4 py-2 font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
              acceptsOrders
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {acceptsOrders ? 'Disable Orders' : 'Enable Orders'}
          </button>
        </div>
      </div>

      {/* Rejection Reason (if rejected) */}
      {storeOwner.application_status === 'rejected' && storeOwner.rejection_reason && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Rejection Reason</h3>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{storeOwner.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Store Actions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Store Actions</h3>
        <div className="flex gap-3">
          {storeOwner.application_status === 'approved' && (
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suspend Store
            </button>
          )}

          {storeOwner.application_status === 'suspended' && (
            <button
              onClick={handleReactivate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reactivate Store
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
