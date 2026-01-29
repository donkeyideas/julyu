import Link from 'next/link'

export const metadata = {
  title: 'Analytics - Store Portal - Julyu',
  description: 'View your store analytics and sales reports',
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          View sales reports and performance metrics
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Analytics dashboard will be available in Phase 5 of development.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Track your sales performance, view customer insights, and monitor your store&apos;s growth over time.
        </p>
        <Link
          href="/store-portal"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 inline-block"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Metrics you&apos;ll be able to track:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Total revenue and order volume (daily, weekly, monthly)</li>
          <li>Average order value and customer lifetime value</li>
          <li>Top selling products and inventory turnover</li>
          <li>Peak ordering times and customer demographics</li>
          <li>Commission and payout history</li>
          <li>Customer ratings and feedback</li>
        </ul>
      </div>
    </div>
  )
}
