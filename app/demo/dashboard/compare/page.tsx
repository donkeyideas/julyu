'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getChainsForZip, GroceryChain } from '@/lib/demo/data/grocery-chains'
import { searchProducts, getChainPrice, generatePriceForSearchTerm } from '@/lib/demo/data/products'

// ─── Interfaces ───

interface ItemPrice {
  item: string
  name: string
  brand: string
  price: number
  available: boolean
}

interface StoreResult {
  chainId: string
  chainName: string
  chainColor: string
  chainDomain: string
  total: number
  itemPrices: ItemPrice[]
  itemsFound: number
  distance: string
  address: string
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
  store: StoreResult | null
}

interface ShopOptionsModal {
  isOpen: boolean
  store: StoreResult | null
}

interface DeliveryPartner {
  id: string
  name: string
  displayName: string
  description: string
  iconLetter: string
  brandColor: string
  baseUrl: string
}

// Mock delivery partners
const MOCK_DELIVERY_PARTNERS: DeliveryPartner[] = [
  { id: 'instacart', name: 'Instacart', displayName: 'Instacart', description: 'Delivery in as fast as 1 hour', iconLetter: 'I', brandColor: '#43B02A', baseUrl: 'https://www.instacart.com' },
  { id: 'doordash', name: 'DoorDash', displayName: 'DoorDash', description: 'Grocery delivery to your door', iconLetter: 'D', brandColor: '#FF3008', baseUrl: 'https://www.doordash.com' },
  { id: 'uber-eats', name: 'Uber Eats', displayName: 'Uber Eats', description: 'Order groceries with Uber', iconLetter: 'U', brandColor: '#06C167', baseUrl: 'https://www.ubereats.com' },
]

// Generate fake distances deterministically
function fakeDistance(chainId: string, zip: string): string {
  let hash = 0
  const s = chainId + zip
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  const miles = 0.5 + (Math.abs(hash) % 100) / 10
  return miles.toFixed(1)
}

// Generate fake address deterministically
function fakeAddress(chainName: string, zip: string): string {
  let hash = 0
  const s = chainName + zip
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  const streetNum = 100 + (Math.abs(hash) % 9900)
  const streets = ['Main St', 'Oak Ave', 'Elm Blvd', 'Market St', 'Broadway', 'Highland Dr', 'Pine Rd', 'Maple Ln', 'Commerce Way', 'Central Ave']
  const street = streets[Math.abs(hash) % streets.length]
  return `${streetNum} ${street}`
}

// ─── StoreLogo Component ───

function StoreLogo({ domain, name, color }: { domain: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (failed) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`https://img.logo.dev/${domain}?token=pk_anonymous&size=64`}
      alt={name}
      width={32}
      height={32}
      className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
      style={{ backgroundColor: '#fff' }}
      onError={() => setFailed(true)}
    />
  )
}

// ─── Toast Component ───

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl" style={{ backgroundColor: '#22c55e', color: '#000' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-semibold text-sm">{message}</span>
      </div>
    </div>
  )
}

// ─── Main Page (wrapped in Suspense) ───

export default function DemoComparePage() {
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

// ─── Page Content ───

function ComparePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [list, setList] = useState('milk 2%\neggs organic\nbread whole wheat\napples gala\nchicken breast\npasta penne')
  const [zipCode, setZipCode] = useState('45202')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasCompared, setHasCompared] = useState(false)
  const [results, setResults] = useState<StoreResult[]>([])
  const [fromAssistant, setFromAssistant] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [storeDetails, setStoreDetails] = useState<StoreDetailsModal>({ isOpen: false, store: null })
  const [shopOptions, setShopOptions] = useState<ShopOptionsModal>({ isOpen: false, store: null })
  const [toast, setToast] = useState<string | null>(null)

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('demoCompareSearchHistory')
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
            localStorage.removeItem('compareItems')
          }
        } catch (e) {
          console.error('Failed to parse stored items:', e)
        }
      }
    }
  }, [searchParams])

  const itemCount = list.split('\n').filter(item => item.trim() !== '').length

  const saveToHistory = (items: string[], storeResults: StoreResult[]) => {
    const best = storeResults.length > 0 ? storeResults[0] : null
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(),
      items,
      zipCode,
      address,
      timestamp: Date.now(),
      resultSummary: best ? {
        total: best.total,
        itemsFound: best.itemsFound,
        bestStore: best.chainName,
      } : undefined,
    }

    const newHistory = [historyItem, ...searchHistory.slice(0, 9)]
    setSearchHistory(newHistory)
    localStorage.setItem('demoCompareSearchHistory', JSON.stringify(newHistory))
  }

  const loadFromHistory = (item: SearchHistoryItem) => {
    setList(item.items.join('\n'))
    setZipCode(item.zipCode)
    setAddress(item.address)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('demoCompareSearchHistory')
  }

  const handleCompare = () => {
    setLoading(true)
    setHasCompared(false)
    setResults([])

    const items = list.split('\n').filter(item => item.trim())

    // Simulate a small delay to feel realistic
    setTimeout(() => {
      const chains = getChainsForZip(zipCode)

      const storeResults: StoreResult[] = chains.map(chain => {
        const itemPrices: ItemPrice[] = []
        let total = 0

        for (const item of items) {
          const products = searchProducts(item)
          let price: number
          let name: string
          let brand: string
          if (products.length > 0) {
            price = getChainPrice(products[0], chain)
            name = products[0].name
            brand = products[0].brand
          } else {
            price = generatePriceForSearchTerm(item, chain)
            name = item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            brand = 'Store Brand'
          }
          itemPrices.push({ item, name, brand, price, available: true })
          total += price
        }

        return {
          chainId: chain.id,
          chainName: chain.name,
          chainColor: chain.color,
          chainDomain: chain.domain,
          total: Math.round(total * 100) / 100,
          itemPrices,
          itemsFound: items.length,
          distance: fakeDistance(chain.id, zipCode),
          address: fakeAddress(chain.name, zipCode),
        }
      })

      storeResults.sort((a, b) => a.total - b.total)
      setResults(storeResults)
      setHasCompared(true)
      setLoading(false)

      // Save to history
      saveToHistory(items, storeResults)
    }, 1200)
  }

  const bestStore = results.length > 0 ? results[0] : null
  const mostExpensive = results.length > 0 ? results[results.length - 1] : null

  const handleViewDetails = (store: StoreResult) => {
    setStoreDetails({ isOpen: true, store })
  }

  const handleShopHere = (store: StoreResult) => {
    setShopOptions({ isOpen: true, store })
  }

  const handleDirections = (store: StoreResult) => {
    const storeAddress = `${store.chainName} ${store.address}, ${zipCode}`
    const destination = encodeURIComponent(storeAddress)
    const origin = address || zipCode
    if (origin) {
      const encodedOrigin = encodeURIComponent(origin)
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destination}`, '_blank')
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
    }
    // Mock recording
    setToast(`Shopping trip to ${store.chainName} recorded!`)
  }

  const handleShopOption = (option: 'directions') => {
    if (!shopOptions.store) return
    const store = shopOptions.store

    if (option === 'directions') {
      handleDirections(store)
    }

    setShopOptions({ isOpen: false, store: null })
  }

  const handlePartnerClick = (partner: DeliveryPartner) => {
    if (!shopOptions.store) return
    const store = shopOptions.store
    setToast(`Opening ${partner.displayName} for ${store.chainName}...`)
    window.open(partner.baseUrl, '_blank')
    setShopOptions({ isOpen: false, store: null })
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
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
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
                            {item.zipCode} {item.address && `\u2022 ${item.address}`}
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

      {/* Input Card */}
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
              maxLength={5}
              className="w-32 px-4 py-2 rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {getChainsForZip(zipCode).length} stores in your area
            </p>
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
            <span>{itemCount}</span> items
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

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Searching for real-time prices...</div>
        </div>
      )}

      {/* Results */}
      {hasCompared && results.length > 0 && (
        <div>
          {/* Summary Card */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                  ${bestStore?.total.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {bestStore?.itemsFound || 0}/{itemCount}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Items Found</div>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {results.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Stores Searched</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full inline-block">
                  Demo Prices
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Results */}
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Comparison Results</h2>
          <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Store</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Distance</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Items Available</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Total</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>vs Best Price</th>
                  <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((store, idx) => {
                  const isBest = idx === 0
                  const vsBest = bestStore ? Math.round((store.total - bestStore.total) * 100) / 100 : 0

                  return (
                    <tr
                      key={store.chainId}
                      className={`hover:opacity-80 ${isBest ? 'bg-green-500/5' : ''}`}
                      style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <StoreLogo domain={store.chainDomain} name={store.chainName} color={store.chainColor} />
                          <div>
                            <div className="flex items-center gap-2">
                              {isBest && (
                                <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">BEST</span>
                              )}
                              <strong style={{ color: isBest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                {store.chainName}
                              </strong>
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{store.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                        {store.distance} mi
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-primary)' }}>
                        {store.itemsFound}/{itemCount}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${isBest ? 'text-xl' : ''}`} style={{ color: isBest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          ${store.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        {isBest ? (
                          <span className="text-xs font-semibold bg-green-500/10 text-green-500 px-2 py-1 rounded-full">Cheapest</span>
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                            +${vsBest.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShopHere(store)}
                            className={`px-3 py-2 font-semibold rounded-lg transition text-sm ${isBest ? 'bg-green-500 text-black hover:bg-green-600' : ''}`}
                            style={!isBest ? { border: '1px solid var(--border-color)', color: 'var(--text-secondary)' } : undefined}
                          >
                            Shop Here
                          </button>
                          <button
                            onClick={() => handleDirections(store)}
                            className="px-3 py-2 rounded-lg transition text-sm"
                            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            Directions
                          </button>
                          <button
                            onClick={() => handleViewDetails(store)}
                            className="px-3 py-2 rounded-lg transition text-sm"
                            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Tip */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-30)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-primary)' }}>Tip:</strong> Click <strong>Details</strong> on any store to see the actual products matched for your items at that store.
            </p>
          </div>
        </div>
      )}

      {/* Store Details Modal */}
      {storeDetails.isOpen && storeDetails.store && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <StoreLogo domain={storeDetails.store.chainDomain} name={storeDetails.store.chainName} color={storeDetails.store.chainColor} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{storeDetails.store.chainName}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{storeDetails.store.address}, {zipCode}</p>
                </div>
              </div>
              <button
                onClick={() => setStoreDetails({ isOpen: false, store: null })}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6 p-4 bg-green-500/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    ${storeDetails.store.total.toFixed(2)}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total for {storeDetails.store.itemsFound} items</div>
                </div>
                {bestStore && storeDetails.store.chainId !== bestStore.chainId && (
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                      +${(storeDetails.store.total - bestStore.total).toFixed(2)} vs best
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {bestStore.chainName} is cheapest
                    </div>
                  </div>
                )}
                {bestStore && storeDetails.store.chainId === bestStore.chainId && (
                  <span className="text-xs font-bold bg-green-500 text-black px-3 py-1 rounded-full">BEST PRICE</span>
                )}
              </div>

              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Items at this store:</h4>
              <div className="space-y-3">
                {storeDetails.store.itemPrices.map((ip, idx) => {
                  // Find cheapest price across all stores for this item
                  const cheapestForItem = Math.min(...results.map(r => r.itemPrices[idx]?.price || Infinity))
                  const diff = ip.price - cheapestForItem
                  const isCheapest = diff < 0.01

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{ip.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ip.brand} &middot; Searched: &quot;{ip.item}&quot;</div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>${ip.price.toFixed(2)}</div>
                          {isCheapest ? (
                            <div className="text-xs font-semibold" style={{ color: '#22c55e' }}>Best price</div>
                          ) : (
                            <div className="text-xs" style={{ color: '#ef4444' }}>+${diff.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setStoreDetails({ isOpen: false, store: null })
                    handleShopHere(storeDetails.store!)
                  }}
                  className="flex-1 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Shop Here
                </button>
                <button
                  onClick={() => {
                    setStoreDetails({ isOpen: false, store: null })
                    handleDirections(storeDetails.store!)
                  }}
                  className="px-6 py-3 rounded-lg transition font-semibold"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Get Directions
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
              <div className="flex items-center gap-3">
                <StoreLogo domain={shopOptions.store.chainDomain} name={shopOptions.store.chainName} color={shopOptions.store.chainColor} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Shop at {shopOptions.store.chainName}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{shopOptions.store.address}, {zipCode}</p>
                </div>
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
                      {shopOptions.store.address}, {zipCode}
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
                  {MOCK_DELIVERY_PARTNERS.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => handlePartnerClick(partner)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl transition hover:opacity-90"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: partner.brandColor }}
                      >
                        <span className="text-white font-bold text-lg">{partner.iconLetter}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{partner.displayName}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{partner.description}</div>
                      </div>
                      <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  ))}
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
