import { redirect } from 'next/navigation'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import Link from 'next/link'

export const metadata = {
  title: 'Store Portal - Julyu',
  description: 'Manage your store inventory and orders',
}

export default async function StorePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { storeOwner, user, error } = await getStoreOwnerAnyStatus()

  // Redirect to login if not authenticated
  if (error && error.includes('Unauthorized')) {
    redirect('/auth/login?redirect=/store-portal')
  }

  // Redirect to application page if no store owner account
  if (error && error.includes('Not a store owner')) {
    redirect('/store-portal/apply')
  }

  // Show application status page if not approved
  if (storeOwner && storeOwner.application_status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  Julyu
                </Link>
                <span className="text-gray-400">|</span>
                <span className="text-lg font-medium text-gray-700">Store Portal</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              {storeOwner.application_status === 'pending' && (
                <>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Pending</h2>
                  <p className="text-gray-600 mb-6">
                    Your store application is pending review. We&apos;ll notify you via email once it&apos;s been reviewed.
                  </p>
                </>
              )}

              {storeOwner.application_status === 'under_review' && (
                <>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h2>
                  <p className="text-gray-600 mb-6">
                    Your application is currently being reviewed by our team. This usually takes 1-2 business days.
                  </p>
                </>
              )}

              {storeOwner.application_status === 'rejected' && (
                <>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h2>
                  <p className="text-gray-600 mb-4">
                    Unfortunately, your application was not approved at this time.
                  </p>
                  {storeOwner.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {storeOwner.rejection_reason}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mb-6">
                    You can reapply after addressing the issues mentioned above.
                  </p>
                  <Link
                    href="/store-portal/apply"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Reapply
                  </Link>
                </>
              )}

              {storeOwner.application_status === 'suspended' && (
                <>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
                  <p className="text-gray-600 mb-6">
                    Your store account has been suspended. Please contact support for more information.
                  </p>
                  <a
                    href="mailto:support@julyu.com"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Contact Support
                  </a>
                </>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Applied: {new Date(storeOwner.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Business: {storeOwner.business_name}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Store owner is approved - show full portal
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  Julyu
                </Link>
                <span className="text-gray-400">|</span>
                <span className="text-lg font-medium text-gray-700">Store Portal</span>
              </div>

              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/store-portal"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/store-portal/inventory"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Inventory
                </Link>
                <Link
                  href="/store-portal/orders"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Orders
                </Link>
                <Link
                  href="/store-portal/analytics"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Analytics
                </Link>
                <Link
                  href="/store-portal/settings"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{storeOwner?.business_name}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
