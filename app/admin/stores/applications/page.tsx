'use client'

import { useEffect, useState } from 'react'

export default function StoreApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      // Use API route to fetch applications (bypasses RLS)
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
    try {
      const response = await fetch(`/api/admin/store-applications/${id}/approve`, {
        method: 'POST',
      })
      if (response.ok) {
        loadApplications()
      }
    } catch (error) {
      console.error('Error approving application:', error)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/store-applications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (response.ok) {
        loadApplications()
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
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
                <tr key={app.id} className="hover:bg-gray-800/50 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                          onClick={() => handleApprove(app.id)}
                          className="text-green-500 hover:text-green-400 font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="text-red-500 hover:text-red-400 font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.application_status !== 'pending' && (
                      <span style={{ color: 'var(--text-muted)' }}>No actions</span>
                    )}
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
    </div>
  )
}
