'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const DEFAULT_ITEMS = [
  'milk 2%',
  'eggs organic',
  'bread whole wheat',
  'apples gala',
  'chicken breast',
  'pasta penne'
]

export default function InteractiveDemo() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS)
  const [newItem, setNewItem] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddItem = () => {
    if (newItem.trim() && items.length < 10) {
      setItems([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleCompare = async () => {
    if (!zipCode.trim()) {
      setError('Please enter your zip code')
      return
    }

    if (items.length === 0) {
      setError('Please add at least one item')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/lists/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items,
          zipCode: zipCode.trim(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResults(data)
      }
    } catch (err: any) {
      setError('Failed to compare prices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem()
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Try It Now</h3>
          <p className="text-sm text-gray-500">Live price comparison</p>
        </div>
      </div>

      {!results ? (
        <div className="space-y-4">
          {/* Zip Code Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Zip Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code (e.g., 45202)"
              maxLength={5}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Items List */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Your Grocery List ({items.length}/10 items)
            </label>
            <div className="bg-black border border-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 hover:bg-gray-900 rounded"
                >
                  <span className="text-gray-300">{item}</span>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Input */}
          {items.length < 10 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add an item..."
                className="flex-1 px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
              >
                Add
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            disabled={loading || items.length === 0}
            className="w-full py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Searching prices...
              </>
            ) : (
              <>
                Compare Prices
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Best Price Found</div>
              <div className="text-3xl font-bold text-green-500">
                ${results.summary?.estimatedTotal?.toFixed(2) || '0.00'}
              </div>
            </div>
            <button
              onClick={() => setResults(null)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Try Again
            </button>
          </div>

          {/* Message if no stores */}
          {results.message && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-500 text-sm">{results.message}</p>
            </div>
          )}

          {/* Best Store */}
          {results.bestOption && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">BEST</span>
                <span className="font-semibold text-green-500">{results.bestOption.store.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                {results.bestOption.store.distance && `${results.bestOption.store.distance} mi away`}
                {' | '}
                {results.summary?.itemsFound || 0}/{results.summary?.totalItems || 0} items found
              </div>
            </div>
          )}

          {/* Items Found */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Items Found</div>
            <div className="bg-black border border-gray-800 rounded-lg divide-y divide-gray-800 max-h-40 overflow-y-auto">
              {results.products?.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <div>
                      <div className="text-sm text-white truncate max-w-[150px]">{product.name}</div>
                      {product.brand && (
                        <div className="text-xs text-gray-500">{product.brand}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-500">
                    {product.price ? `$${product.price.toFixed(2)}` : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-gray-800">
            <Link
              href="/auth/signup"
              className="block w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-center"
            >
              Sign Up to Save Your Lists
            </Link>
            <p className="text-xs text-gray-500 text-center mt-2">
              Get price alerts when items go on sale
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
