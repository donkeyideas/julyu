import Link from 'next/link'

export const metadata = {
  title: 'Import Receipt - Store Portal - Julyu',
  description: 'Import inventory from a receipt',
}

export default function ImportReceiptPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Import from Receipt</h1>
        <p className="text-gray-600 mt-1">
          Upload a supplier receipt to automatically extract products
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Receipt OCR import will be available in Phase 2 of development.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This feature will use AI to automatically extract product information from your supplier receipts,
          making it easy to update your inventory in bulk.
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
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it will work:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Upload a photo or PDF of your supplier receipt</li>
          <li>AI automatically extracts product names, prices, and quantities</li>
          <li>Review and confirm the extracted items</li>
          <li>Products are added to your inventory in seconds</li>
        </ol>
      </div>
    </div>
  )
}
