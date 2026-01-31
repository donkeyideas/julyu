'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface StoreOwner {
  id: string
  business_name: string
  business_type: string
  business_email?: string
  application_status: string
  commission_rate: number
  accepts_orders: boolean
  created_at: string
  bodega_stores?: Array<{
    id: string
    name: string
    city: string
    state: string
  }>
}

export default function AllStoresPage() {
  const [stores, setStores] = useState<StoreOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; store: StoreOwner | null }>({ open: false, store: null })
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'error' | 'success' }>({ open: false, title: '', message: '', type: 'error' })

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      // Use API route to fetch stores (bypasses RLS)
      const response = await fetch('/api/admin/stores')

      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      } else {
        console.error('Failed to fetch stores:', response.statusText)
        setStores([])
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const openDeleteConfirm = (store: StoreOwner) => {
    setDeleteConfirmModal({ open: true, store })
  }

  const handleDelete = async () => {
    if (!deleteConfirmModal.store) return

    const storeId = deleteConfirmModal.store.id
    const storeName = deleteConfirmModal.store.business_name
    setDeleting(storeId)
    setDeleteConfirmModal({ open: false, store: null })

    try {
      console.log('[Delete] Attempting to delete store owner:', storeId)
      const response = await fetch(`/api/admin/store-owners/${storeId}/delete`, {
        method: 'DELETE',
      })

      const data = await response.json()
      console.log('[Delete] Response:', response.status, data)

      if (response.ok) {
        await loadStores()
        setAlertModal({ open: true, title: 'Success', message: `${storeName} has been deleted successfully.`, type: 'success' })
      } else {
        setAlertModal({ open: true, title: 'Delete Failed', message: data.error || data.details || 'Unknown error occurred', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      setAlertModal({ open: true, title: 'Delete Failed', message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const totalStores = stores.length
  const approvedStores = stores.filter(s => s.application_status === 'approved').length
  const pendingStores = stores.filter(s => s.application_status === 'pending').length
  const activeStores = stores.filter(s => s.application_status === 'approved' && s.accepts_orders).length
  const totalLocations = stores.reduce((sum, owner) => sum + (owner.bodega_stores?.length || 0), 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-500',
    under_review: 'bg-blue-500/15 text-blue-500',
    approved: 'bg-green-500/15 text-green-500',
    rejected: 'bg-red-500/15 text-red-500',
    suspended: 'bg-gray-500/15 text-gray-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: '#10b981' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading stores...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>All Stores</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage all store owners and locations</p>
        </div>
        <Link
          href="/admin/stores/applications"
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          View Applications
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total Stores</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Approved</div>
          <div className="text-4xl font-black text-green-500">{approvedStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Pending</div>
          <div className="text-4xl font-black text-yellow-500">{pendingStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Active</div>
          <div className="text-4xl font-black text-blue-500">{activeStores}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total Locations</div>
          <div className="text-4xl font-black text-purple-500">{totalLocations}</div>
        </div>
      </div>

      {/* Stores Table */}
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
                  Locations
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Commission Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Accepting Orders
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
              {stores.map((store) => (
                <tr key={store.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{store.business_name}</div>
                    {store.business_email && (
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{store.business_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {store.business_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{store.bodega_stores?.length || 0} location(s)</div>
                    {store.bodega_stores && store.bodega_stores.length > 0 && (
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {store.bodega_stores[0].name}
                        {store.bodega_stores.length > 1 && ` +${store.bodega_stores.length - 1} more`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[store.application_status]}`}>
                      {store.application_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                    {store.commission_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.accepts_orders ? (
                      <span className="text-green-500 text-sm font-semibold">Yes</span>
                    ) : (
                      <span className="text-red-500 text-sm font-semibold">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(store.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-4">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="text-green-500 hover:text-green-400 font-semibold"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => openDeleteConfirm(store)}
                        disabled={deleting === store.id}
                        className="text-red-500 hover:text-red-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === store.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No stores found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && deleteConfirmModal.store && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setDeleteConfirmModal({ open: false, store: null })}
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
                Delete Store?
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{deleteConfirmModal.store.business_name}</strong>? This will delete the store owner account, all locations, and all related data.
              </p>
              <p className="text-sm text-red-500 mt-2 font-semibold">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmModal({ open: false, store: null })}
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

      {/* Alert Modal */}
      {alertModal.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
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
