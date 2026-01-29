import Link from 'next/link'

export const metadata = {
  title: 'POS Integration - Store Portal - Julyu',
  description: 'Connect your POS system to automatically sync inventory',
}

export default function POSSyncPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/store-portal/inventory"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">POS Integration</h1>
        <p className="text-gray-600 mt-1">
          Connect your Point of Sale system to automatically sync inventory
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          POS integration will be available in Phase 2 of development.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This feature will automatically sync your inventory from Square, Clover, and other popular POS systems,
          keeping your Julyu store always up-to-date with your in-store inventory.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            href="/store-portal/inventory/add"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Add Products Manually
          </Link>
          <Link
            href="/store-portal/inventory"
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
          >
            View Inventory
          </Link>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3">Supported POS Systems:</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-blue-200 p-3">
            <div className="font-semibold text-gray-900">Square</div>
            <div className="text-xs text-gray-500 mt-1">OAuth integration with automatic sync</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-3">
            <div className="font-semibold text-gray-900">Clover</div>
            <div className="text-xs text-gray-500 mt-1">OAuth integration with automatic sync</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-3 opacity-60">
            <div className="font-semibold text-gray-900">Toast</div>
            <div className="text-xs text-gray-500 mt-1">Coming later</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-3 opacity-60">
            <div className="font-semibold text-gray-900">Shopify</div>
            <div className="text-xs text-gray-500 mt-1">Coming later</div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">Benefits of POS Integration:</h3>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Automatic inventory updates in real-time</li>
          <li>No manual data entry required</li>
          <li>Sync product names, prices, and stock levels</li>
          <li>Reduce errors and save time</li>
          <li>Always keep your online store in sync with your physical store</li>
        </ul>
      </div>
    </div>
  )
}
