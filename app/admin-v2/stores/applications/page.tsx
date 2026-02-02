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
      const response = await fetch('/api/admin/stores/manage')
      const data = await response.json()

      if (response.ok) {
        setApplications(data.stores || [])
        setError(null)
      } else {
        setApplications([])
        const errorMsg = data.details || data.error || `Failed to load stores (${response.status})`
        setError(errorMsg)
      }
    } catch (error) {
      setApplications([])
      setError('Network error - could not connect to server')
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
      const response = await fetch('/api/admin/stores/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
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
      const response = await fetch('/api/admin/stores/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rejectModal.app.id, action: 'reject', reason: rejectReason }),
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
    const businessName = deleteConfirmModal.app.business_name
    setDeleting(id)
    setDeleteConfirmModal({ open: false, app: null })

    try {
      const response = await fetch(`/api/admin/stores/manage?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        await loadApplications()
        if (selectedApplication?.id === id) {
          closeModal()
        }
        setAlertModal({ open: true, title: 'Success', message: `${businessName} deleted successfully.`, type: 'success' })
      } else {
        const errorMsg = data.error || 'Unknown error occurred'
        setAlertModal({ open: true, title: 'Delete Failed', message: errorMsg, type: 'error' })
      }
    } catch (error) {
      setAlertModal({ open: true, title: 'Delete Failed', message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Store Applications</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Review and manage store owner applications</p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            loadApplications()
          }}
          className="px-4 py-2 rounded-lg font-semibold transition"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalApplications}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Pending</div>
          <div className="text-3xl font-bold text-yellow-500">{pendingApps}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Under Review</div>
          <div className="text-3xl font-bold text-blue-500">{underReviewApps}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Approved</div>
          <div className="text-3xl font-bold text-green-500">{approvedApps}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Rejected</div>
          <div className="text-3xl font-bold text-red-500">{rejectedApps}</div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Business Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allApplications.map((app: any) => (
                <tr
                  key={app.id}
                  onClick={() => openModal(app)}
                  className="hover:bg-gray-800/50 transition cursor-pointer"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{app.business_name}</div>
                    {app.business_email && (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{app.business_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{app.business_type || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {app.bodega_stores && app.bodega_stores.length > 0 ? (
                      <>
                        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{app.bodega_stores[0].name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {app.bodega_stores[0].city}, {app.bodega_stores[0].state}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>No location</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[app.application_status]}`}>
                      {app.application_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    {app.application_status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(app.id) }}
                          className="text-green-500 hover:text-green-400 font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openRejectModal(app) }}
                          className="text-red-500 hover:text-red-400 font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteConfirm(app) }}
                      disabled={deleting === app.id}
                      className="text-red-500 hover:text-red-400 font-semibold disabled:opacity-50"
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
            {error ? (
              <>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => { setLoading(true); setError(null); loadApplications() }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition"
                >
                  Retry
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No applications found</p>
            )}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {isModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }} onClick={closeModal}>
          <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 px-8 py-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[selectedApplication.application_status]}`}>
                  {selectedApplication.application_status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={closeModal} className="text-2xl font-bold hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>×</button>
            </div>

            <div className="px-8 py-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Business Name</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Business Type</div>
                    <div className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_type || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Email</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_phone || 'N/A'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Address</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedApplication.business_address || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {selectedApplication.bodega_stores && selectedApplication.bodega_stores.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Store Location</h3>
                  {selectedApplication.bodega_stores.map((store: any, index: number) => (
                    <div key={store.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Store Name</div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.name || 'N/A'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Address</div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.address}, {store.city}, {store.state} {store.zip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 px-8 py-6" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
              {selectedApplication.application_status === 'pending' ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(selectedApplication.id)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-black bg-green-500 hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedApplication)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openDeleteConfirm(selectedApplication)}
                  disabled={deleting === selectedApplication.id}
                  className="w-full px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }} onClick={() => setDeleteConfirmModal({ open: false, app: null })}>
          <div className="rounded-2xl max-w-md w-full p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Application?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{deleteConfirmModal.app.business_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmModal({ open: false, app: null })} className="flex-1 px-4 py-3 rounded-lg font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.app && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }} onClick={() => setRejectModal({ open: false, app: null })}>
          <div className="rounded-2xl max-w-md w-full p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Reject Application</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Provide a reason for rejecting {rejectModal.app.business_name}.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-4">
              <button onClick={() => setRejectModal({ open: false, app: null })} className="flex-1 px-4 py-3 rounded-lg font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }} onClick={() => setAlertModal({ ...alertModal, open: false })}>
          <div className="rounded-2xl max-w-sm w-full p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {alertModal.type === 'success' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{alertModal.title}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{alertModal.message}</p>
            <button onClick={() => setAlertModal({ ...alertModal, open: false })} className={`w-full px-6 py-3 rounded-xl font-bold text-white ${alertModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>OK</button>
          </div>
        </div>
      )}
    </div>
  )
}
