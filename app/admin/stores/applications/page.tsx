import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import ApplicationCard from '@/components/admin/StoreApplicationCard'

export const metadata = {
  title: 'Store Applications - Admin - Julyu',
  description: 'Review and manage store owner applications',
}

export default async function StoreApplicationsPage() {
  // Verify admin access
  const { isAdmin, error } = await verifyAdminAccess()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()

  // Fetch all applications with store owner and store details
  const { data: applications, error: fetchError } = await supabase
    .from('store_owners')
    .select(`
      *,
      bodega_stores(*)
    `)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Fetch applications error:', fetchError)
  }

  const allApplications = applications || []

  // Separate applications by status
  const pendingApplications = allApplications.filter(app =>
    app.application_status === 'pending' || app.application_status === 'under_review'
  )
  const approvedApplications = allApplications.filter(app =>
    app.application_status === 'approved'
  )
  const rejectedApplications = allApplications.filter(app =>
    app.application_status === 'rejected'
  )
  const suspendedApplications = allApplications.filter(app =>
    app.application_status === 'suspended'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage store owner applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingApplications.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {approvedApplications.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {rejectedApplications.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Suspended</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {suspendedApplications.length}
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Review ({pendingApplications.length})
          </h2>
          <div className="space-y-4">
            {pendingApplications.map(application => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Approved Stores ({approvedApplications.length})
          </h2>
          <div className="space-y-4">
            {approvedApplications.map(application => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rejected Applications ({rejectedApplications.length})
          </h2>
          <div className="space-y-4">
            {rejectedApplications.map(application => (
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Suspended Stores ({suspendedApplications.length})
          </h2>
          <div className="space-y-4">
            {suspendedApplications.map(application => (
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No store applications yet</p>
        </div>
      )}
    </div>
  )
}
