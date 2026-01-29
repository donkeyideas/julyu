'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ApplicationCard from '@/components/admin/StoreApplicationCard'

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

  // Separate applications by status
  const pendingApplications = allApplications.filter((app: any) =>
    app.application_status === 'pending' || app.application_status === 'under_review'
  )
  const approvedApplications = allApplications.filter((app: any) =>
    app.application_status === 'approved'
  )
  const rejectedApplications = allApplications.filter((app: any) =>
    app.application_status === 'rejected'
  )
  const suspendedApplications = allApplications.filter((app: any) =>
    app.application_status === 'suspended'
  )

  return (
    <div className="space-y-6">
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Store Applications</h1>
        <p className="text-gray-500 mt-2">Review and manage store owner applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Pending Review</div>
          <div className="text-3xl font-black text-yellow-500">
            {pendingApplications.length}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Approved</div>
          <div className="text-3xl font-black text-green-500">
            {approvedApplications.length}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Rejected</div>
          <div className="text-3xl font-black text-red-500">
            {rejectedApplications.length}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="text-sm text-gray-500 mb-2">Suspended</div>
          <div className="text-3xl font-black">
            {suspendedApplications.length}
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-black mb-4">
            Pending Review ({pendingApplications.length})
          </h2>
          <div className="space-y-4">
            {pendingApplications.map((application: any) => (
              <ApplicationCard
                key={application.id}
                application={application}
                store={application.bodega_stores?.[0]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Applications */}
      {approvedApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-black mb-4">
            Approved Stores ({approvedApplications.length})
          </h2>
          <div className="space-y-4">
            {approvedApplications.map((application: any) => (
              <ApplicationCard
                key={application.id}
                application={application}
                store={application.bodega_stores?.[0]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Applications */}
      {rejectedApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-black mb-4">
            Rejected Applications ({rejectedApplications.length})
          </h2>
          <div className="space-y-4">
            {rejectedApplications.map((application: any) => (
              <ApplicationCard
                key={application.id}
                application={application}
                store={application.bodega_stores?.[0]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suspended Applications */}
      {suspendedApplications.length > 0 && (
        <div>
          <h2 className="text-2xl font-black mb-4">
            Suspended Stores ({suspendedApplications.length})
          </h2>
          <div className="space-y-4">
            {suspendedApplications.map((application: any) => (
              <ApplicationCard
                key={application.id}
                application={application}
                store={application.bodega_stores?.[0]}
              />
            ))}
          </div>
        </div>
      )}

      {allApplications.length === 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500">No store applications yet</p>
        </div>
      )}
    </div>
  )
}
