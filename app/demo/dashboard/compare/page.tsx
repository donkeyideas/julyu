'use client'

import { useState, useMemo, Fragment } from 'react'
import { getChainsForZip } from '@/lib/demo/data/grocery-chains'
import { searchProducts, getChainPrice, generatePriceForSearchTerm } from '@/lib/demo/data/products'

const DEFAULT_ITEMS = `milk 2%
eggs large
bread whole wheat
chicken breast
bananas
pasta spaghetti`

interface StoreResult {
  chainId: string
  chainName: string
  chainColor: string
  total: number
  itemPrices: { item: string; price: number }[]
  itemsFound: number
}

export default function DemoComparePage() {
  const [zipCode, setZipCode] = useState('45202')
  const [itemsText, setItemsText] = useState(DEFAULT_ITEMS)
  const [hasCompared, setHasCompared] = useState(false)
  const [expandedStore, setExpandedStore] = useState<string | null>(null)

  const results = useMemo(() => {
    if (!hasCompared) return []

    const items = itemsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (items.length === 0) return []

    const chains = getChainsForZip(zipCode)

    const storeResults: StoreResult[] = chains.map(chain => {
      const itemPrices: { item: string; price: number }[] = []
      let total = 0

      for (const item of items) {
        const products = searchProducts(item)
        let price: number
        if (products.length > 0) {
          price = getChainPrice(products[0], chain)
        } else {
          price = generatePriceForSearchTerm(item, chain)
        }
        itemPrices.push({ item, price })
        total += price
      }

      return {
        chainId: chain.id,
        chainName: chain.name,
        chainColor: chain.color,
        total: Math.round(total * 100) / 100,
        itemPrices,
        itemsFound: items.length,
      }
    })

    storeResults.sort((a, b) => a.total - b.total)
    return storeResults
  }, [hasCompared, itemsText, zipCode])

  const cheapest = results.length > 0 ? results[0] : null
  const mostExpensive = results.length > 0 ? results[results.length - 1] : null
  const potentialSavings = cheapest && mostExpensive
    ? Math.round((mostExpensive.total - cheapest.total) * 100) / 100
    : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Compare Prices</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter your grocery items and find the cheapest store near you
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Zip Code */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Zip Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              maxLength={5}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="Enter zip code"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {getChainsForZip(zipCode).length} stores in your area
            </p>
          </div>

          {/* Items */}
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Grocery Items (one per line)
            </label>
            <textarea
              value={itemsText}
              onChange={e => setItemsText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y font-mono"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              placeholder="Enter items, one per line..."
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setHasCompared(true)}
            className="px-6 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#22c55e' }}
          >
            Compare Prices
          </button>
          {hasCompared && (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Comparing {itemsText.split('\n').filter(s => s.trim()).length} items across {results.length} stores
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {hasCompared && results.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Best Store */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e' }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Best Store</div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {cheapest?.chainName}
              </div>
              <div className="text-3xl font-black" style={{ color: '#22c55e' }}>
                ${cheapest?.total.toFixed(2)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Cheapest for your list
              </div>
            </div>

            {/* Potential Savings */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Potential Savings</div>
              <div className="text-3xl font-black" style={{ color: '#22c55e' }}>
                ${potentialSavings.toFixed(2)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                vs {mostExpensive?.chainName} (${mostExpensive?.total.toFixed(2)})
              </div>
            </div>

            {/* Stores Compared */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Stores Compared</div>
              <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                {results.length}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                In the {zipCode} area
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Store Ranking
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['RANK', 'STORE', 'TOTAL', 'SAVINGS vs HIGHEST', 'ITEMS FOUND', ''].map(h => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold uppercase tracking-wider pb-3 px-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((store, idx) => {
                    const savings = mostExpensive
                      ? Math.round((mostExpensive.total - store.total) * 100) / 100
                      : 0
                    const isExpanded = expandedStore === store.chainId

                    return (
                      <Fragment key={store.chainId}>
                        <tr
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                          className="cursor-pointer transition hover:opacity-80"
                          onClick={() => setExpandedStore(isExpanded ? null : store.chainId)}
                        >
                          <td className="py-4 px-2">
                            <span
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                              style={{
                                backgroundColor: idx === 0 ? 'rgba(34,197,94,0.2)' : 'var(--bg-primary)',
                                color: idx === 0 ? '#22c55e' : 'var(--text-secondary)',
                              }}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: store.chainColor }}
                              />
                              <span
                                className="font-semibold text-sm"
                                style={{ color: idx === 0 ? '#22c55e' : 'var(--text-primary)' }}
                              >
                                {store.chainName}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              ${store.total.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            {savings > 0 ? (
                              <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                                -${savings.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>--</span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {store.itemsFound}/{store.itemPrices.length}
                          </td>
                          <td className="py-4 px-2">
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </td>
                        </tr>

                        {/* Expanded item-by-item prices */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="pb-4 px-2">
                              <div
                                className="rounded-lg p-4 mt-1"
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                              >
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {store.itemPrices.map((ip, i) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center text-sm px-3 py-2 rounded-lg"
                                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                                    >
                                      <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>
                                        {ip.item}
                                      </span>
                                      <span className="font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>
                                        ${ip.price.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

