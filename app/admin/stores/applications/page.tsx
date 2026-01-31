'use client'

import { useEffect, useState } from 'react'

export default function StoreApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Modal states
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; app: any | null }>({ open: false, app: null })
  const [rejectModal, setRejectModal] = useState<{ open: boolean; app: any | null }>({ open: false, app: null })
  const [rejectReason, setRejectReason] = useState('')
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'error' | 'success' }>({ open: false, title: '', message: '', type: 'error' })

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/admin/store-applications')

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        console.error('Failed to fetch applications:', response.statusText)
        setApplications([])
      }
    } catch (error) {
      console.error('Error loading applications:', error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading applications...</div>
        </div>
      </div>
    )
  }

  const allApplications = applications || []
  const totalApplications = allApplications.length
  const pendingApps = allApplications.filter((a: any) => a.application_status === 'pending').length
  const underReviewApps = allApplications.filter((a: any) => a.application_status === 'under_review').length
  const approvedApps = allApplications.filter((a: any) => a.application_status === 'approved').length
  const rejectedApps = allApplications.filter((a: any) => a.application_status === 'rejected').length

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-500',
    under_review: 'bg-blue-500/15 text-blue-500',
    approved: 'bg-green-500/15 text-green-500',
    rejected: 'bg-red-500/15 text-red-500',
    suspended: 'bg-gray-500/15 text-gray-500',
  }

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/store-applications/${id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        await loadApplications()
        setIsModalOpen(false)
        setAlertModal({ open: true, title: 'Success', message: 'Application approved successfully!', type: 'success' })
      } else {
        setError(data.error || 'Failed to approve application')
        setAlertModal({ open: true, title: 'Error', message: data.error || 'Failed to approve application', type: 'error' })
      }
    } catch (error) {
      console.error('Error approving application:', error)
      setError('Network error. Please try again.')
      setAlertModal({ open: true, title: 'Error', message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (app: any) => {
    setRejectModal({ open: true, app })
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectModal.app || !rejectReason.trim()) return

    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/store-applications/${rejectModal.app.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      const data = await response.json()

      if (response.ok) {
        await loadApplications()
        setIsModalOpen(false)
        setRejectModal({ open: false, app: null })
        setAlertModal({ open: true, title: 'Success', message: 'Application rejected.', type: 'success' })
      } else {
        setError(data.error || 'Failed to reject application')
        setAlertModal({ open: true, title: 'Error', message: data.error || 'Failed to reject application', type: 'error' })
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      setError('Network error. Please try again.')
      setAlertModal({ open: true, title: 'Error', message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (app: any) => {
    setSelectedApplication(app)
    setIsModalOpen(true)
    setError(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedApplication(null)
    setError(null)
  }

  const openDeleteConfirm = (app: any) => {
    setDeleteConfirmModal({ open: true, app })
  }

  const handleDelete = async () => {
    if (!deleteConfirmModal.app) return

    const id = deleteConfirmModal.app.id
    setDeleting(id)
    setDeleteConfirmModal({ open: false, app: null })

    try {
      console.log('[Delete] Attempting to delete store owner:', id)
      const response = await fetch(`/api/admin/store-owners/${id}/delete`, {
        method: 'DELETE',
      })

      const data = await response.json()
      console.log('[Delete] Response:', response.status, data)

      if (response.ok) {
        await loadApplications()
        if (selectedApplication?.id === id) {
          closeModal()
        }
        setAlertModal({ open: true, title: 'Success', message: 'Store deleted successfully.', type: 'success' })
      } else {
        setAlertModal({ open: true, title: 'Delete Failed', message: data.error || 'Unknown error occurred', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      setAlertModal({ open: true, title: 'Delete Failed', message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Store Applications</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Review and manage store owner applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Applications</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalApplications}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Pending</div>
          <div className="text-4xl font-black text-yellow-500">{pendingApps}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Under Review</div>
          <div className="text-4xl font-black text-blue-500">{underReviewApps}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Approved</div>
          <div className="text-4xl font-black text-green-500">{approvedApps}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Rejected</div>
          <div className="text-4xl font-black text-red-500">{rejectedApps}</div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderTop: '1px solid var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--bg-card)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Business Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
              {allApplications.map((app: any) => (
                <tr
                  key={app.id}
                  onClick={() => openModal(app)}
                  className="hover:bg-gray-800/50 transition cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{app.business_name}</div>
                    {app.business_email && (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{app.business_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {app.business_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.bodega_stores && app.bodega_stores.length > 0 ? (
                      <>
                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{app.bodega_stores[0].name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {app.bodega_stores[0].city}, {app.bodega_stores[0].state} {app.bodega_stores[0].zip}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No location</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[app.application_status]}`}>
                      {app.application_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-4">
                    {app.application_status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(app.id)
                          }}
                          className="text-green-500 hover:text-green-400 font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openRejectModal(app)
                          }}
                          className="text-red-500 hover:text-red-400 font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteConfirm(app)
                      }}
                      disabled={deleting === app.id}
                      className="text-red-500 hover:text-red-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === app.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allApplications.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No applications found</p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {isModalOpen && selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 px-8 py-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {selectedApplication.business_name}
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[selectedApplication.application_status]}`}>
                  {selectedApplication.application_status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-2xl font-bold hover:opacity-70 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-8">
              {/* Business Information */}
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business Name</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business Type</div>
                    <div className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_type || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business Email</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business Phone</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_phone || 'N/A'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business Address</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_address || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Tax ID</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.tax_id || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Business License</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_license || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Store Location */}
              {selectedApplication.bodega_stores && selectedApplication.bodega_stores.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Store Location
                  </h3>
                  {selectedApplication.bodega_stores.map((store: any, index: number) => (
                    <div key={store.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Store Name</div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Phone</div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.phone || 'N/A'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Address</div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {store.address}, {store.city}, {store.state} {store.zip}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Application Details */}
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Application Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Submitted</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(selectedApplication.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Commission Rate</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.commission_rate}%</div>
                  </div>
                  {selectedApplication.approval_date && (
                    <div>
                      <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Approval Date</div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {new Date(selectedApplication.approval_date).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedApplication.rejection_reason && (
                    <div className="md:col-span-2">
                      <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Rejection Reason</div>
                      <div className="font-semibold text-red-500">{selectedApplication.rejection_reason}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 px-8 py-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              {selectedApplication.application_status === 'pending' ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(selectedApplication.id)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedApplication)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openDeleteConfirm(selectedApplication)}
                  disabled={deleting === selectedApplication.id}
                  className="w-full px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === selectedApplication.id ? 'Deleting...' : 'Delete Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && deleteConfirmModal.app && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setDeleteConfirmModal({ open: false, app: null })}
        >
          <div
            className="rounded-2xl max-w-md w-full p-8"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Delete Store Application?
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{deleteConfirmModal.app.business_name}</strong>? This will also delete the associated store owner account and all related data.
              </p>
              <p className="text-sm text-red-500 mt-2 font-semibold">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmModal({ open: false, app: null })}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectModal.open && rejectModal.app && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setRejectModal({ open: false, app: null })}
        >
          <div
            className="rounded-2xl max-w-md w-full p-8"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Reject Application
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Please provide a reason for rejecting <strong>{rejectModal.app.business_name}</strong>'s application.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setRejectModal({ open: false, app: null })}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setAlertModal({ ...alertModal, open: false })}
        >
          <div
            className="rounded-2xl max-w-sm w-full p-8"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {alertModal.type === 'success' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {alertModal.title}
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {alertModal.message}
              </p>
              <button
                onClick={() => setAlertModal({ ...alertModal, open: false })}
                className={`w-full px-6 py-3 rounded-xl font-bold text-white transition ${alertModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
