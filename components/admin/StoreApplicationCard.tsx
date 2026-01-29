'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StoreOwner {
  id: string
  user_id: string
  business_name: string
  business_type: string
  business_address?: string
  business_phone?: string
  business_email?: string
  tax_id?: string
  business_license?: string
  application_status: string
  commission_rate: number
  rejection_reason?: string
  created_at: string
  approval_date?: string
}

interface BodegaStore {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  created_at: string
}

interface Props {
  application: StoreOwner
  store?: BodegaStore
}

export default function StoreApplicationCard({ application, store }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    suspended: 'Suspended',
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this store application?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/store-applications/${application.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/store-applications/${application.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application')
      }

      setShowRejectModal(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this store?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/store-applications/${application.id}/suspend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend store')
      }

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

    try {
      const response = await fetch(`/api/admin/store-applications/${application.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate store')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {application.business_name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[application.application_status]}`}>
                {statusLabels[application.application_status]}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">
                  <strong>Type:</strong> {application.business_type}
                </p>
                <p className="text-gray-600">
                  <strong>Email:</strong> {application.business_email}
                </p>
                <p className="text-gray-600">
                  <strong>Phone:</strong> {application.business_phone}
                </p>
                {application.tax_id && (
                  <p className="text-gray-600">
                    <strong>Tax ID:</strong> {application.tax_id}
                  </p>
                )}
              </div>

              {store && (
                <div>
                  <p className="text-gray-600">
                    <strong>Store:</strong> {store.name}
                  </p>
                  <p className="text-gray-600">
                    <strong>Address:</strong> {store.address}, {store.city}, {store.state} {store.zip}
                  </p>
                  <p className="text-gray-600">
                    <strong>Store Phone:</strong> {store.phone}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Applied: {new Date(application.created_at).toLocaleString()}
              {application.approval_date && (
                <> • Approved: {new Date(application.approval_date).toLocaleString()}</>
              )}
            </div>

            {application.rejection_reason && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Rejection Reason:</strong> {application.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <div className="ml-4 flex flex-col space-y-2">
            {(application.application_status === 'pending' || application.application_status === 'under_review') && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </>
            )}

            {application.application_status === 'approved' && (
              <button
                onClick={handleSuspend}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend
              </button>
            )}

            {application.application_status === 'suspended' && (
              <button
                onClick={handleReactivate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reactivate
              </button>
            )}

            {application.application_status === 'rejected' && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application
            </h3>

            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a detailed reason for rejection..."
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setError(null)
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
