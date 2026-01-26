'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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
    address?: string
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

interface SearchHistoryItem {
  id: string
  items: string[]
  zipCode: string
  address: string
  timestamp: number
  resultSummary?: {
    total: number
    itemsFound: number
    bestStore?: string
  }
}

interface StoreDetailsModal {
  isOpen: boolean
  store: StoreOption | null
  products: ProductResult[]
}

interface ShopOptionsModal {
  isOpen: boolean
  store: StoreOption | null
}

// Wrap in Suspense for useSearchParams
export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <ComparePageContent />
    </Suspense>
  )
}

function ComparePageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500">Loading...</div>
      </div>
    </div>
  )
}

function ComparePageContent() {
  const searchParams = useSearchParams()
  const [list, setList] = useState('milk 2%\neggs organic\nbread whole wheat\napples gala\nchicken breast\npasta penne')
  const [zipCode, setZipCode] = useState('45202')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalyzeResult | null>(null)
  const [fromAssistant, setFromAssistant] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [storeDetails, setStoreDetails] = useState<StoreDetailsModal>({ isOpen: false, store: null, products: [] })
  const [shopOptions, setShopOptions] = useState<ShopOptionsModal>({ isOpen: false, store: null })

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('compareSearchHistory')
    if (stored) {
      try {
        const history = JSON.parse(stored) as SearchHistoryItem[]
        setSearchHistory(history)
      } catch (e) {
        console.error('Failed to parse search history:', e)
      }
    }
  }, [])

  // Load items from AI Assistant if redirected
  useEffect(() => {
    if (searchParams.get('fromAssistant') === 'true') {
      const stored = localStorage.getItem('compareItems')
      if (stored) {
        try {
          const items = JSON.parse(stored) as string[]
          if (items.length > 0) {
            setList(items.join('\n'))
            setFromAssistant(true)
            localStorage.removeItem('compareItems') // Clear after use
          }
        } catch (e) {
          console.error('Failed to parse stored items:', e)
        }
      }
    }
  }, [searchParams])

  const itemCount = list.split('\n').filter(item => item.trim() !== '').length

  const saveToHistory = (items: string[], result: AnalyzeResult) => {
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(),
      items,
      zipCode,
      address,
      timestamp: Date.now(),
      resultSummary: result.success ? {
        total: result.summary?.estimatedTotal || 0,
        itemsFound: result.summary?.itemsFound || 0,
        bestStore: result.bestOption?.store.name
      } : undefined
    }

    const newHistory = [historyItem, ...searchHistory.slice(0, 9)] // Keep last 10 searches
    setSearchHistory(newHistory)
    localStorage.setItem('compareSearchHistory', JSON.stringify(newHistory))
  }

  const loadFromHistory = (item: SearchHistoryItem) => {
    setList(item.items.join('\n'))
    setZipCode(item.zipCode)
    setAddress(item.address)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('compareSearchHistory')
  }

  const handleCompare = async () => {
    setLoading(true)
    setResults(null)

    const items = list.split('\n').filter(item => item.trim())

    try {
      const response = await fetch('/api/lists/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          zipCode: zipCode,
          address: address,
        }),
      })

      const data = await response.json()
      console.log('[Compare] API Response:', data)
      setResults(data)

      // Save to history
      saveToHistory(items, data)
    } catch (error) {
      console.error('Comparison error:', error)
      const errorResult: AnalyzeResult = {
        success: false,
        dataSource: 'error',
        bestOption: null,
        alternatives: [],
        products: [],
        summary: { totalItems: 0, itemsFound: 0, itemsMissing: 0, estimatedTotal: 0 },
        error: 'Failed to analyze prices. Please try again.',
      }
      setResults(errorResult)
    } finally {
      setLoading(false)
    }
  }

  const handleShopHere = (store: StoreOption) => {
    // Open shop options modal instead of directly going to maps
    setShopOptions({ isOpen: true, store })
  }

  const handleShopOption = (option: 'directions' | 'instacart' | 'doordash' | 'walmart' | 'shipt' | 'amazon') => {
    if (!shopOptions.store) return

    const store = shopOptions.store
    const storeName = store.store.name
    const retailer = store.store.retailer
    const storeAddress = store.store.address || `${storeName} ${retailer} ${zipCode}`

    switch (option) {
      case 'directions':
        // Open Google Maps with the store location
        const query = encodeURIComponent(storeAddress)
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
        break
      case 'instacart':
        // Open Instacart search for the store
        const instacartStore = retailer.toLowerCase().includes('kroger') ? 'kroger' : retailer.toLowerCase()
        window.open(`https://www.instacart.com/store/${instacartStore}/storefront`, '_blank')
        break
      case 'doordash':
        // Open DoorDash grocery search
        window.open(`https://www.doordash.com/convenience/`, '_blank')
        break
      case 'walmart':
        // Open Walmart grocery delivery
        window.open(`https://www.walmart.com/grocery`, '_blank')
        break
      case 'shipt':
        // Open Shipt for delivery
        window.open(`https://www.shipt.com/`, '_blank')
        break
      case 'amazon':
        // Open Amazon Fresh
        window.open(`https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo`, '_blank')
        break
    }

    setShopOptions({ isOpen: false, store: null })
  }

  const handleViewDetails = (store: StoreOption) => {
    setStoreDetails({
      isOpen: true,
      store,
      products: results?.products || []
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-4xl font-black">Compare Prices</h1>

        {/* Search History Button */}
        <div className="relative">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-300">History</span>
            {searchHistory.length > 0 && (
              <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {searchHistory.length}
              </span>
            )}
          </button>

          {/* History Dropdown */}
          {showHistory && (
            <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-400">Search History</span>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {searchHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No search history yet
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {searchHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full p-3 text-left hover:bg-gray-800/50 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {item.items.slice(0, 3).join(', ')}
                            {item.items.length > 3 && ` +${item.items.length - 3} more`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.zipCode} {item.address && `• ${item.address}`}
                          </div>
                          {item.resultSummary && (
                            <div className="text-xs text-green-500 mt-1">
                              ${item.resultSummary.total.toFixed(2)} at {item.resultSummary.bestStore}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Import Banner */}
      {fromAssistant && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="flex-1">
            <p className="text-green-400 font-medium text-sm">Ingredients imported from AI Assistant</p>
            <p className="text-gray-400 text-xs">Review the items below and click &quot;Compare Prices&quot; to find the best deals</p>
          </div>
          <button
            onClick={() => setFromAssistant(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Enter Your Grocery List</h2>

        {/* Location Inputs */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code..."
              className="w-32 px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter street address for better results..."
              className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
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
          <div className="text-gray-500">Searching for real-time prices...</div>
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
                  ${results.summary?.estimatedTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">Estimated Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}
                </div>
                <div className="text-sm text-gray-500">Items Found</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {results.summary?.storesSearched || 0}
                </div>
                <div className="text-sm text-gray-500">Stores Searched</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-block">
                  {results.dataSource === 'kroger_api' ? 'Live Prices' : 'Database Prices'}
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
                    <td className="p-4">
                      {results.bestOption.store.distance ? `${results.bestOption.store.distance} mi` : 'N/A'}
                    </td>
                    <td className="p-4">{results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}</td>
                    <td className="p-4 font-bold text-green-500 text-xl">${results.bestOption.total?.toFixed(2)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleShopHere(results.bestOption!)}
                        className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                      >
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
                    <td className="p-4">
                      {alt.store.distance ? `${alt.store.distance} mi` : 'N/A'}
                    </td>
                    <td className="p-4">{results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}</td>
                    <td className="p-4 font-bold">${alt.total?.toFixed(2)}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleShopHere(alt)}
                        className="px-3 py-2 border border-gray-700 rounded-lg hover:border-green-500 transition text-sm"
                      >
                        Directions
                      </button>
                      <button
                        onClick={() => handleViewDetails(alt)}
                        className="px-3 py-2 border border-gray-700 rounded-lg hover:border-green-500 transition text-sm"
                      >
                        Details
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

      {results && results.message && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6 mb-8">
          <p className="text-yellow-500">{results.message}</p>
        </div>
      )}

      {/* Store Details Modal */}
      {storeDetails.isOpen && storeDetails.store && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{storeDetails.store.store.name}</h3>
                <p className="text-sm text-gray-500">{storeDetails.store.store.retailer}</p>
              </div>
              <button
                onClick={() => setStoreDetails({ isOpen: false, store: null, products: [] })}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6 p-4 bg-green-500/10 rounded-xl">
                <div className="text-2xl font-bold text-green-500">
                  ${storeDetails.store.total.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Total for available items</div>
              </div>

              <h4 className="font-semibold mb-4">Items at this store:</h4>
              <div className="space-y-3">
                {storeDetails.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black rounded-lg">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.brand || 'Generic'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {product.available ? (
                        <div className="font-bold">${product.price?.toFixed(2) || '-'}</div>
                      ) : (
                        <div className="text-red-500 text-sm">Not available</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setStoreDetails({ isOpen: false, store: null, products: [] })
                    handleShopHere(storeDetails.store!)
                  }}
                  className="flex-1 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Shop Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Options Modal */}
      {shopOptions.isOpen && shopOptions.store && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Shop at {shopOptions.store.store.name}</h3>
                <p className="text-sm text-gray-500">{shopOptions.store.store.retailer}</p>
              </div>
              <button
                onClick={() => setShopOptions({ isOpen: false, store: null })}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-400 text-sm mb-4">How would you like to shop?</p>

              {/* In-Store Option */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Shop In-Store</h4>
                <button
                  onClick={() => handleShopOption('directions')}
                  className="w-full flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Get Directions</div>
                    <div className="text-xs text-gray-400">
                      {shopOptions.store.store.address || `${shopOptions.store.store.name} near ${zipCode}`}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Delivery Options */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Get it Delivered</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleShopOption('instacart')}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">I</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Instacart</div>
                      <div className="text-xs text-gray-400">Delivery in as fast as 1 hour</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShopOption('shipt')}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition"
                  >
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Shipt</div>
                      <div className="text-xs text-gray-400">Same-day delivery from local stores</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShopOption('doordash')}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">DoorDash</div>
                      <div className="text-xs text-gray-400">Fast delivery from nearby stores</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShopOption('walmart')}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">W</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Walmart Grocery</div>
                      <div className="text-xs text-gray-400">Delivery & pickup available</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShopOption('amazon')}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500/50 transition"
                  >
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <span className="text-black font-bold text-lg">A</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">Amazon Fresh</div>
                      <div className="text-xs text-gray-400">Free delivery with Prime</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-gray-600 mt-4">
                Prices and availability may vary by delivery service
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close history */}
      {showHistory && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
