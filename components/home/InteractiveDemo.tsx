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

// Fixed demo items - these cannot be changed
const DEMO_ITEMS = [
  'milk 2%',
  'eggs organic',
  'bread whole wheat',
  'apples gala',
  'chicken breast',
  'pasta penne'
]

export default function InteractiveDemo() {
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!zipCode.trim()) {
      setError('Please enter your zip code')
      return
    }

    if (zipCode.trim().length !== 5 || !/^\d+$/.test(zipCode.trim())) {
      setError('Please enter a valid 5-digit zip code')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/demo/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: DEMO_ITEMS,
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
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter zip code (e.g., 45202)"
              maxLength={5}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Fixed Items List */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Sample Grocery List ({DEMO_ITEMS.length} items)
            </label>
            <div className="bg-black border border-gray-800 rounded-lg p-3">
              {DEMO_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center py-2 px-2"
                >
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            disabled={loading}
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

          <p className="text-xs text-gray-500 text-center">
            Sign up to create your own lists with unlimited items
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Best Price at {results.bestOption?.store.name}</div>
              <div className="text-3xl font-bold text-green-500">
                ${results.summary?.estimatedTotal?.toFixed(2) || '0.00'}
              </div>
              {results.bestOption?.savings && results.bestOption.savings > 0 && (
                <div className="text-sm text-green-400">
                  Save ${results.bestOption.savings.toFixed(2)} vs average
                </div>
              )}
            </div>
            <button
              onClick={() => setResults(null)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Try Again
            </button>
          </div>

          {/* Store Comparison */}
          <div className="space-y-2">
            {/* Best Store */}
            {results.bestOption && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">BEST</span>
                    <span className="font-semibold text-green-500">{results.bestOption.store.name}</span>
                  </div>
                  <span className="text-lg font-bold text-green-500">${results.bestOption.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {results.bestOption.store.distance} mi away
                </div>
              </div>
            )}

            {/* Alternative Stores */}
            {results.alternatives?.map((alt, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">{alt.store.name}</span>
                  <span className="text-lg font-semibold text-gray-400">${alt.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {alt.store.distance} mi away
                </div>
              </div>
            ))}
          </div>

          {/* Items Breakdown */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Price Breakdown ({results.summary?.itemsFound || 0} items)</div>
            <div className="bg-black border border-gray-800 rounded-lg divide-y divide-gray-800 max-h-40 overflow-y-auto">
              {results.products?.filter(p => p.available).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm text-white">{product.name}</div>
                    {product.brand && (
                      <div className="text-xs text-gray-500">{product.brand}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-green-500">
                    ${product.price?.toFixed(2)}
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
              Sign Up for Real-Time Prices
            </Link>
            <p className="text-xs text-gray-500 text-center mt-2">
              Compare prices across 50+ stores in your area
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
