'use client'

import { useState } from 'react'

interface ProductResult {
  userInput: string
  name: string
  brand?: string
  price: number | null
  imageUrl?: string
  available: boolean
}

interface StoreOption {
  store: {
    id: string
    name: string
    retailer: string
    distance?: string | null
  }
  total: number
  savings?: number
  items: any[]
}

interface AnalyzeResult {
  success: boolean
  dataSource: string
  bestOption: StoreOption | null
  alternatives: StoreOption[]
  products: ProductResult[]
  summary: {
    totalItems: number
    itemsFound: number
    itemsMissing: number
    estimatedTotal: number
    storesSearched?: number
  }
  error?: string
  message?: string
}

export default function ComparePage() {
  const [list, setList] = useState('milk 2%\neggs organic\nbread whole wheat\napples gala\nchicken breast\npasta penne')
  const [zipCode, setZipCode] = useState('45202')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalyzeResult | null>(null)

  const itemCount = list.split('\n').filter(item => item.trim() !== '').length

  const handleCompare = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/lists/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: list.split('\n').filter(item => item.trim()),
          zipCode: zipCode,
        }),
      })

      const data = await response.json()
      console.log('[Compare] API Response:', data)
      setResults(data)
    } catch (error) {
      console.error('Comparison error:', error)
      setResults({
        success: false,
        dataSource: 'error',
        bestOption: null,
        alternatives: [],
        products: [],
        summary: { totalItems: 0, itemsFound: 0, itemsMissing: 0, estimatedTotal: 0 },
        error: 'Failed to analyze prices. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Compare Prices</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Enter Your Grocery List</h2>

        {/* Zip Code Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Your Zip Code</label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter zip code..."
            className="w-48 px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none"
          />
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <textarea
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder="Enter items (one per line)..."
            className="w-full min-h-[200px] bg-transparent text-white resize-y outline-none font-mono"
          />
          <div className="mt-4 text-sm text-gray-500">
            <span id="itemCount">{itemCount}</span> items
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || itemCount === 0}
          className="mt-6 w-full py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
        >
          {loading ? 'Searching prices...' : 'Compare Prices Across Stores'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Searching Kroger stores for real-time prices...</div>
        </div>
      )}

      {results && results.error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 mb-8">
          <p className="text-red-500">{results.error}</p>
        </div>
      )}

      {results && results.success && (
        <div>
          {/* Summary Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-green-500">
                  ${results.summary.estimatedTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">Estimated Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {results.summary.itemsFound}/{results.summary.totalItems}
                </div>
                <div className="text-sm text-gray-500">Items Found</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {results.summary.storesSearched || 1}
                </div>
                <div className="text-sm text-gray-500">Stores Searched</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-block">
                  {results.dataSource === 'kroger_api' ? 'Live Kroger Prices' : 'Database Prices'}
                </div>
              </div>
            </div>
          </div>

          {/* Store Results */}
          <h2 className="text-3xl font-bold mb-6">Comparison Results</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Store</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Distance</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Items Available</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Total</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.bestOption && (
                  <tr className="border-t border-gray-800 hover:bg-black/50 bg-green-500/5">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">BEST</span>
                        <strong className="text-green-500">{results.bestOption.store.name}</strong>
                      </div>
                      <div className="text-sm text-gray-500">{results.bestOption.store.retailer}</div>
                    </td>
                    <td className="p-4">{results.bestOption.store.distance || '-'} mi</td>
                    <td className="p-4">{results.summary.itemsFound}/{results.summary.totalItems}</td>
                    <td className="p-4 font-bold text-green-500 text-xl">${results.bestOption.total?.toFixed(2)}</td>
                    <td className="p-4">
                      <button className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
                        Shop Here
                      </button>
                    </td>
                  </tr>
                )}
                {results.alternatives?.map((alt, idx) => (
                  <tr key={idx} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4">
                      <strong>{alt.store.name}</strong>
                      <div className="text-sm text-gray-500">{alt.store.retailer}</div>
                    </td>
                    <td className="p-4">-</td>
                    <td className="p-4">{results.summary.itemsFound}/{results.summary.totalItems}</td>
                    <td className="p-4 font-bold">${alt.total?.toFixed(2)}</td>
                    <td className="p-4">
                      <button className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Product Details */}
          <h2 className="text-2xl font-bold mb-4">Item Details</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Your Item</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Matched Product</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Brand</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Price</th>
                  <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.products?.map((product, idx) => (
                  <tr key={idx} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4 text-gray-400">{product.userInput}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{product.brand || '-'}</td>
                    <td className="p-4 font-bold">
                      {product.price ? `$${product.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4">
                      {product.available ? (
                        <span className="text-green-500 text-sm">Found</span>
                      ) : (
                        <span className="text-red-500 text-sm">Not Found</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && !results.success && !results.error && results.message && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6">
          <p className="text-yellow-500">{results.message}</p>
        </div>
      )}
    </div>
  )
}
