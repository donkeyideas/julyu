import Link from 'next/link'

export const metadata = {
  title: 'Orders - Store Portal - Julyu',
  description: 'Manage customer orders',
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage and fulfill customer orders
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Order management will be available in Phase 3 of development.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Once this feature is live, you'll be able to receive and manage customer orders, update order status, and coordinate deliveries.
        </p>
        <Link
          href="/store-portal"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 inline-block"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">What you'll be able to do:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Receive real-time notifications when customers place orders</li>
          <li>Accept or decline orders based on product availability</li>
          <li>Update order status (preparing, ready, out for delivery)</li>
          <li>Track DoorDash deliveries in real-time</li>
          <li>View order history and customer information</li>
        </ul>
      </div>
    </div>
  )
}
