'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Helper to get auth headers for API calls (supports Firebase/Google users)
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('julyu_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.id) headers['x-user-id'] = user.id
        if (user.email) headers['x-user-email'] = user.email
        if (user.full_name) headers['x-user-name'] = user.full_name
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

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

interface DeliveryPartner {
  id: string
  name: string
  display_name: string | null
  slug: string
  description: string | null
  logo_url: string | null
  icon_letter: string | null
  brand_color: string | null
  base_url: string
  deep_link_template: string | null
  supports_deep_linking: boolean | null
  supports_search_url: boolean | null
  supported_retailers: string[] | null
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
        <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
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
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)

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

  // Load items from a shopping list if listId is provided
  useEffect(() => {
    const listId = searchParams.get('listId')
    if (listId) {
      const fetchListItems = async () => {
        try {
          const response = await fetch(`/api/lists/${listId}`, { headers: getAuthHeaders() })
          if (response.ok) {
            const data = await response.json()
            if (data.list?.list_items && data.list.list_items.length > 0) {
              const items = data.list.list_items.map((item: { user_input: string; quantity?: number }) => {
                const qty = item.quantity && item.quantity > 1 ? `${item.quantity} ` : ''
                return `${qty}${item.user_input}`
              })
              setList(items.join('\n'))
            }
          }
        } catch (error) {
          console.error('Failed to load list items:', error)
        }
      }
      fetchListItems()
    }
  }, [searchParams])

  const itemCount = list.split('\n').filter(item => item.trim() !== '').length

  // Fetch delivery partners when shop modal opens
  useEffect(() => {
    if (shopOptions.isOpen && deliveryPartners.length === 0) {
      const fetchPartners = async () => {
        setLoadingPartners(true)
        try {
          const retailer = shopOptions.store?.store.retailer?.toLowerCase() || ''
          const response = await fetch(`/api/delivery-partners?retailer=${encodeURIComponent(retailer)}`)
          if (response.ok) {
            const data = await response.json()
            setDeliveryPartners(data.partners || [])
          }
        } catch (error) {
          console.error('Failed to fetch delivery partners:', error)
        } finally {
          setLoadingPartners(false)
        }
      }
      fetchPartners()
    }
  }, [shopOptions.isOpen, shopOptions.store?.store.retailer, deliveryPartners.length])

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
        headers: getAuthHeaders(),
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

  const handleShopOption = (option: 'directions') => {
    if (!shopOptions.store) return

    const store = shopOptions.store
    const storeName = store.store.name
    const retailer = store.store.retailer
    const storeAddress = store.store.address || `${storeName} ${retailer} ${zipCode}`

    if (option === 'directions') {
      // Open Google Maps with the store location
      const query = encodeURIComponent(storeAddress)
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
    }

    setShopOptions({ isOpen: false, store: null })
  }

  const handlePartnerClick = async (partner: DeliveryPartner) => {
    if (!shopOptions.store) return

    const store = shopOptions.store
    const items = results?.products?.map(p => ({
      userInput: p.userInput,
      name: p.name,
      price: p.price,
      quantity: 1
    })) || []

    try {
      // Track the click and get the deep link URL
      const response = await fetch('/api/delivery-partners/click', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          partnerId: partner.id,
          store: {
            store: store.store.name,
            retailer: store.store.retailer,
            address: store.store.address,
            total: store.total
          },
          items
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Open the generated deep link URL
        window.open(data.url, '_blank')
      } else {
        // Fallback to base URL if tracking fails
        window.open(partner.base_url, '_blank')
      }
    } catch (error) {
      console.error('Failed to track click:', error)
      // Fallback to base URL
      window.open(partner.base_url, '_blank')
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
      <div className="mb-10 pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Compare Prices</h1>

        {/* Search History Button */}
        <div className="relative">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ color: 'var(--text-secondary)' }}>History</span>
            {searchHistory.length > 0 && (
              <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {searchHistory.length}
              </span>
            )}
          </button>

          {/* History Dropdown */}
          {showHistory && (
            <div className="absolute right-0 top-12 w-80 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Search History</span>
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
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No search history yet
                </div>
              ) : (
                <div>
                  {searchHistory.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full p-3 text-left hover:opacity-80 transition"
                      style={{ borderTop: idx > 0 ? '1px solid var(--border-color)' : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.items.slice(0, 3).join(', ')}
                            {item.items.length > 3 && ` +${item.items.length - 3} more`}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {item.zipCode} {item.address && `• ${item.address}`}
                          </div>
                          {item.resultSummary && (
                            <div className="text-xs mt-1" style={{ color: 'var(--accent-primary)' }}>
                              ${item.resultSummary.total.toFixed(2)} at {item.resultSummary.bestStore}
                            </div>
                          )}
                        </div>
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
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

      <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Enter Your Grocery List</h2>

        {/* Location Inputs */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code..."
              className="w-32 px-4 py-2 rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter street address for better results..."
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <textarea
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder="Enter items (one per line)..."
            className="w-full min-h-[200px] bg-transparent resize-y outline-none font-mono"
            style={{ color: 'var(--text-primary)' }}
          />
          <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
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
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Searching for real-time prices...</div>
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
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                  ${results.summary?.estimatedTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Items Found</div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {results.summary?.storesSearched || 0}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Stores Searched</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-block">
                  {results.dataSource === 'kroger_api' ? 'Live Prices' : 'Database Prices'}
                </div>
              </div>
            </div>
          </div>

          {/* Store Results */}
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Comparison Results</h2>
          <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Store</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Distance</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Items Available</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Total</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.bestOption && (
                  <tr className="hover:opacity-80 bg-green-500/5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">BEST</span>
                        <strong style={{ color: 'var(--accent-primary)' }}>{results.bestOption.store.name}</strong>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{results.bestOption.store.retailer}</div>
                    </td>
                    <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                      {results.bestOption.store.distance ? `${results.bestOption.store.distance} mi` : 'N/A'}
                    </td>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}</td>
                    <td className="p-4 font-bold text-xl" style={{ color: 'var(--accent-primary)' }}>${results.bestOption.total?.toFixed(2)}</td>
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
                  <tr key={idx} className="hover:opacity-80" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4">
                      <strong style={{ color: 'var(--text-primary)' }}>{alt.store.name}</strong>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{alt.store.retailer}</div>
                    </td>
                    <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                      {alt.store.distance ? `${alt.store.distance} mi` : 'N/A'}
                    </td>
                    <td className="p-4" style={{ color: 'var(--text-primary)' }}>{results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0}</td>
                    <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>${alt.total?.toFixed(2)}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleShopHere(alt)}
                        className="px-3 py-2 rounded-lg transition text-sm"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        Directions
                      </button>
                      <button
                        onClick={() => handleViewDetails(alt)}
                        className="px-3 py-2 rounded-lg transition text-sm"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Item Details</h2>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Your Item</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Matched Product</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Brand</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Price</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.products?.map((product, idx) => (
                  <tr key={idx} className="hover:opacity-80" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4" style={{ color: 'var(--text-muted)' }}>{product.userInput}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4" style={{ color: 'var(--text-muted)' }}>{product.brand || '-'}</td>
                    <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                      {product.price ? `$${product.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4">
                      {product.available ? (
                        <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>Found</span>
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
          <div className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{storeDetails.store.store.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{storeDetails.store.store.retailer}</p>
              </div>
              <button
                onClick={() => setStoreDetails({ isOpen: false, store: null, products: [] })}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6 p-4 bg-green-500/10 rounded-xl">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                  ${storeDetails.store.total.toFixed(2)}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total for available items</div>
              </div>

              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Items at this store:</h4>
              <div className="space-y-3">
                {storeDetails.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                      )}
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.brand || 'Generic'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {product.available ? (
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>${product.price?.toFixed(2) || '-'}</div>
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
          <div className="rounded-2xl max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Shop at {shopOptions.store.store.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{shopOptions.store.store.retailer}</p>
              </div>
              <button
                onClick={() => setShopOptions({ isOpen: false, store: null })}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>How would you like to shop?</p>

              {/* In-Store Option */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Shop In-Store</h4>
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
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Get Directions</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {shopOptions.store.store.address || `${shopOptions.store.store.name} near ${zipCode}`}
                    </div>
                  </div>
                  <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Delivery Options */}
              <div>
                <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Get it Delivered</h4>
                <div className="space-y-2">
                  {loadingPartners ? (
                    <div className="text-center py-6">
                      <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Loading delivery options...</p>
                    </div>
                  ) : deliveryPartners.length > 0 ? (
                    deliveryPartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => handlePartnerClick(partner)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: partner.brand_color || '#22C55E' }}
                        >
                          {partner.logo_url ? (
                            <img src={partner.logo_url} alt="" className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-white font-bold text-lg">{partner.icon_letter || partner.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{partner.display_name || partner.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{partner.description || 'Order for delivery'}</div>
                        </div>
                        <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      <p className="text-sm">No delivery partners available</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
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
