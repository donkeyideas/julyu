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
          className="text-sm text-green-500 hover:text-green-400 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>POS Integration</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Connect your Point of Sale system to automatically sync inventory
        </p>
      </div>

      <div className="rounded-lg shadow-sm p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/15 mb-4">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          POS integration will be available in Phase 2 of development.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          This feature will automatically sync your inventory from Square, Clover, and other popular POS systems,
          keeping your Julyu store always up-to-date with your in-store inventory.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            href="/store-portal/inventory/add"
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
          >
            Add Products Manually
          </Link>
          <Link
            href="/store-portal/inventory"
            className="px-4 py-2 font-medium rounded-md"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            View Inventory
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Supported POS Systems:</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Square</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>OAuth integration with automatic sync</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Clover</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>OAuth integration with automatic sync</div>
          </div>
          <div className="rounded-lg p-3 opacity-60" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Toast</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Coming later</div>
          </div>
          <div className="rounded-lg p-3 opacity-60" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Shopify</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Coming later</div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Benefits of POS Integration</h3>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Automatic inventory updates in real-time</li>
              <li>• No manual data entry required</li>
              <li>• Sync product names, prices, and stock levels</li>
              <li>• Reduce errors and save time</li>
              <li>• Always keep your online store in sync with your physical store</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
