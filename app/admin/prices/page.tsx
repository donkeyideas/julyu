'use client'

/**
 * Price Database Page - Disabled
 * 
 * This page is currently disabled. Implementation notes are preserved below.
 */

export default function PricesPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-black mb-4">Price Database</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 mb-6">
          <p className="text-yellow-500 font-semibold mb-2">Page Disabled</p>
          <p className="text-gray-400">
            This page is currently disabled. The link remains in the sidebar for future implementation.
          </p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
          <h2 className="text-xl font-bold mb-4 text-white">Implementation Notes</h2>
          <div className="text-sm text-gray-400 space-y-3">
            <p><strong className="text-white">Purpose:</strong> Display price database statistics from Instacart Connect API</p>
            <p><strong className="text-white">Data Sources:</strong> Instacart API, products/prices/retailers tables</p>
            <p><strong className="text-white">Features:</strong> Retailer stats, price freshness, data quality metrics, search/filter</p>
            <p><strong className="text-white">API:</strong> https://docs.instacart.com/connect/</p>
          </div>
        </div>
      </div>
    </div>
  )
}
