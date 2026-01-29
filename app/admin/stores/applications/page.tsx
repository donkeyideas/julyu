'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StoreApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const supabase = createClient()

      // Fetch all applications with store owner and store details
      const { data: applicationsData, error: fetchError } = await supabase
        .from('store_owners')
        .select(`
          *,
          bodega_stores(*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Fetch applications error:', fetchError)
      }

      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading applications...</div>
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
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Store Applications</h1>
          <p className="text-gray-500 mt-2">Review and manage store owner applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Applications</div>
          <div className="text-4xl font-black">{totalApplications}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Pending</div>
          <div className="text-4xl font-black text-yellow-500">{pendingApps}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Under Review</div>
          <div className="text-4xl font-black text-blue-500">{underReviewApps}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Approved</div>
          <div className="text-4xl font-black text-green-500">{approvedApps}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Rejected</div>
          <div className="text-4xl font-black text-red-500">{rejectedApps}</div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {allApplications.map((app: any) => (
                <tr key={app.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold">{app.business_name}</div>
                    {app.business_email && (
                      <div className="text-sm text-gray-500">{app.business_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm capitalize text-gray-400">
                      {app.business_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.bodega_stores && app.bodega_stores.length > 0 ? (
                      <>
                        <div className="text-sm">{app.bodega_stores[0].name}</div>
                        <div className="text-xs text-gray-500">
                          {app.bodega_stores[0].city}, {app.bodega_stores[0].state} {app.bodega_stores[0].zip}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No location</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${statusColors[app.application_status]}`}>
                      {app.application_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      <span className="text-gray-600">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No applications found</p>
          </div>
        )}
      </div>
    </div>
  )
}
