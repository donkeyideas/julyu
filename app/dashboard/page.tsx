'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SavingsData {
  total_saved: number
  total_spent: number
  trips_count: number
  avg_savings_per_trip: number
  month?: string
}

interface ComparisonItem {
  name?: string
  userInput?: string
  price?: number
  quantity?: number
}

interface ProductItem {
  userInput: string
  name?: string
  price?: number | null
  available?: boolean
}

interface Comparison {
  id: string
  created_at: string
  total_savings?: number
  items_count?: number
  item_count?: number
  input_items?: string[] | ComparisonItem[]
  best_option?: {
    store?: { name?: string; retailer?: string }
    total?: number
    items?: ComparisonItem[]
  } | null
  results?: {
    summary?: {
      totalItems?: number
      itemsFound?: number
      matchedProducts?: number
    }
    stores?: Array<{
      name?: string
      storeName?: string
      total: number
      items?: ComparisonItem[]
      itemsFound?: number
    }>
    items?: ComparisonItem[]
    products?: ProductItem[]
    matches?: Array<{ userInput: string }>
  } | null
}

export default function DashboardPage() {
  const [savings, setSavings] = useState<SavingsData>({
    total_saved: 0,
    total_spent: 0,
    trips_count: 0,
    avg_savings_per_trip: 0,
  })
  const [previousMonthSavings, setPreviousMonthSavings] = useState<SavingsData | null>(null)
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [receiptsCount, setReceiptsCount] = useState(0)
  const [previousComparisonsCount, setPreviousComparisonsCount] = useState(0)
  const [previousReceiptsCount, setPreviousReceiptsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [hasHistoricalData, setHasHistoricalData] = useState(false)
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null)

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get current month savings
        const { data: currentSavings } = await supabase
          .from('user_savings')
          .select('*')
          .eq('user_id', user.id)
          .order('month', { ascending: false })
          .limit(1)
          .single()

        // Get previous month savings for comparison
        const { data: previousSavings } = await supabase
          .from('user_savings')
          .select('*')
          .eq('user_id', user.id)
          .order('month', { ascending: false })
          .limit(2)

        // Check if we have historical data and extract previous month
        const hasHistory = previousSavings && previousSavings.length >= 2
        setHasHistoricalData(hasHistory || false)

        if (hasHistory && previousSavings[1]) {
          setPreviousMonthSavings(previousSavings[1])
        }

        // Get comparisons
        const { data: comparisonsData } = await supabase
          .from('comparisons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // Get current month comparisons count
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)

        const previousMonthStart = new Date(currentMonthStart)
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)

        const previousMonthEnd = new Date(currentMonthStart)
        previousMonthEnd.setSeconds(previousMonthEnd.getSeconds() - 1)

        // Get previous month comparisons count
        const { count: prevComparisons } = await supabase
          .from('comparisons')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', currentMonthStart.toISOString())

        // Get receipts count
        const { count: receipts } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get previous month receipts count
        const { count: prevReceipts } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', currentMonthStart.toISOString())

        setSavings(
          currentSavings || {
            total_saved: 0,
            total_spent: 0,
            trips_count: 0,
            avg_savings_per_trip: 0,
          }
        )
        setComparisons(comparisonsData || [])
        setReceiptsCount(receipts || 0)
        setPreviousComparisonsCount(prevComparisons || 0)
        setPreviousReceiptsCount(prevReceipts || 0)
        setLastRefresh(new Date())
      }
    } catch (error) {
      // Using test auth - data will be empty
      console.log('Using test auth, no database data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return null
    const change = current - previous
    const percentChange = (change / previous) * 100
    return { change, percentChange }
  }

  const formatTrend = (current: number, previous: number, isCurrency: boolean = false) => {
    const trend = calculateTrend(current, previous)
    if (!trend) return null

    const sign = trend.change >= 0 ? '↑' : '↓'
    const color = trend.change >= 0 ? 'text-green-500' : 'text-red-500'
    const bgColor = trend.change >= 0 ? 'bg-green-500/15' : 'bg-red-500/15'

    if (isCurrency) {
      return (
        <span className={`inline-block px-3 py-1 ${bgColor} ${color} rounded-lg text-sm`}>
          {sign} ${Math.abs(trend.change).toFixed(2)} vs last month
        </span>
      )
    } else {
      return (
        <span className={`inline-block px-3 py-1 ${bgColor} ${color} rounded-lg text-sm`}>
          {sign} {Math.abs(trend.change)} vs last month
        </span>
      )
    }
  }

  // Helper to get item count from comparison
  const getItemCount = (comp: Comparison): number | string => {
    // Try direct item count fields first
    if (comp.items_count && comp.items_count > 0) return comp.items_count
    if (comp.item_count && comp.item_count > 0) return comp.item_count
    // Try input_items array
    if (comp.input_items?.length) return comp.input_items.length
    // Try results.summary (most reliable for seeded and API data)
    if (comp.results?.summary?.totalItems && comp.results.summary.totalItems > 0) {
      return comp.results.summary.totalItems
    }
    if (comp.results?.summary?.itemsFound && comp.results.summary.itemsFound > 0) {
      return comp.results.summary.itemsFound
    }
    if (comp.results?.summary?.matchedProducts && comp.results.summary.matchedProducts > 0) {
      return comp.results.summary.matchedProducts
    }
    // Try products array (Kroger API stores items here)
    if (comp.results?.products?.length) return comp.results.products.length
    // Try matches array (database fallback stores items here)
    if (comp.results?.matches?.length) return comp.results.matches.length
    // Try best_option.items
    if (comp.best_option?.items?.length) return comp.best_option.items.length
    // Try results.items
    if (comp.results?.items?.length) return comp.results.items.length
    // Try first store's items or itemsFound
    if (comp.results?.stores?.[0]?.items?.length) return comp.results.stores[0].items.length
    if (comp.results?.stores?.[0]?.itemsFound) return comp.results.stores[0].itemsFound
    // Try counting items across all stores (some comparisons only have items in stores array)
    const allStoreItems = comp.results?.stores?.reduce((total, store) => {
      return total + (store.items?.length || store.itemsFound || 0)
    }, 0)
    if (allStoreItems && allStoreItems > 0) return allStoreItems
    return '-'
  }

  // Helper to get items from comparison for modal
  const getComparisonItems = (comp: Comparison): ComparisonItem[] => {
    // Try best_option.items first
    if (comp.best_option?.items?.length) {
      return comp.best_option.items.map(item => ({
        name: item.name || item.userInput || 'Unknown Item',
        price: item.price ?? undefined,
        quantity: item.quantity,
      }))
    }
    // Try results.items (demo seeded data)
    if (comp.results?.items?.length) {
      return comp.results.items.map(item => ({
        name: item.name || item.userInput || 'Unknown Item',
        price: item.price ?? undefined,
        quantity: item.quantity,
      }))
    }
    // Try results.products (Kroger API data)
    if (comp.results?.products?.length) {
      return comp.results.products.map(product => ({
        name: product.name || product.userInput || 'Unknown Item',
        price: product.price ?? undefined,
      }))
    }
    // Try first store's items
    if (comp.results?.stores?.[0]?.items?.length) {
      return comp.results.stores[0].items.map(item => ({
        name: item.name || item.userInput || 'Unknown Item',
        price: item.price ?? undefined,
        quantity: item.quantity,
      }))
    }
    return []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  // Get previous month data for trends (now properly fetched)
  const prevSavingsTotal = previousMonthSavings?.total_saved || 0
  const prevComparisons = previousComparisonsCount
  const prevReceipts = previousReceiptsCount
  const prevAvgSavings = previousMonthSavings?.avg_savings_per_trip || 0

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>My Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition flex items-center gap-2"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl p-6 transition" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Total Savings This Month</div>
          <div className="text-5xl font-black mb-2" style={{ color: 'var(--accent-primary)' }}>
            ${(savings.total_saved || 0).toFixed(2)}
          </div>
          {hasHistoricalData && prevSavingsTotal > 0 ? (
            formatTrend(savings.total_saved, prevSavingsTotal, true)
          ) : (
            <span className="inline-block px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
              No historical data
            </span>
          )}
        </div>

        <div className="rounded-2xl p-6 transition" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Comparisons Run</div>
          <div className="text-5xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{comparisons.length}</div>
          {hasHistoricalData && prevComparisons > 0 ? (
            formatTrend(comparisons.length, prevComparisons, false)
          ) : (
            <span className="inline-block px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
              No historical data
            </span>
          )}
        </div>

        <div className="rounded-2xl p-6 transition" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Receipts Scanned</div>
          <div className="text-5xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{receiptsCount}</div>
          {hasHistoricalData && prevReceipts > 0 ? (
            formatTrend(receiptsCount, prevReceipts, false)
          ) : (
            <span className="inline-block px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
              No historical data
            </span>
          )}
        </div>

        <div className="rounded-2xl p-6 transition" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Average Savings Per Trip</div>
          <div className="text-3xl font-black mb-2" style={{ color: 'var(--accent-primary)' }}>
            ${(savings.avg_savings_per_trip || 0).toFixed(2)}
          </div>
          {hasHistoricalData && prevAvgSavings > 0 ? (
            formatTrend(savings.avg_savings_per_trip, prevAvgSavings, true)
          ) : (
            <span className="inline-block px-3 py-1 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
              No historical data
            </span>
          )}
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Recent Comparisons</h2>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Date</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Items</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Best Store</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Total</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Savings</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.length > 0 ? (
              comparisons.map((comp) => {
                const bestStore = comp.best_option?.store?.name || 'N/A'
                const itemCount = getItemCount(comp)
                const total = comp.best_option?.total || 0

                return (
                  <tr key={comp.id} className="hover:opacity-80 transition" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{new Date(comp.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>{itemCount}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                        {bestStore}
                      </span>
                    </td>
                    <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                      ${total.toFixed(2)}
                    </td>
                    <td className="p-4 font-bold" style={{ color: 'var(--accent-primary)' }}>
                      ${(comp.total_savings || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedComparison(comp)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                        style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  No comparisons yet. Start comparing prices to see your savings!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comparison Details Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Comparison Details</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  {new Date(selectedComparison.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedComparison(null)}
                className="hover:opacity-70 transition p-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Best Store</div>
                <div className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {selectedComparison.best_option?.store?.name || 'N/A'}
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total</div>
                <div className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                  ${(selectedComparison.best_option?.total || 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Savings</div>
                <div className="font-bold text-xl" style={{ color: 'var(--accent-primary)' }}>
                  ${(selectedComparison.total_savings || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Items List */}
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Items Compared</h3>
            {getComparisonItems(selectedComparison).length > 0 ? (
              <div className="space-y-2">
                {getComparisonItems(selectedComparison).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span>
                      )}
                    </div>
                    {item.price && (
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${item.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                <p>Item details not available for this comparison.</p>
                <p className="text-sm mt-2">
                  {getItemCount(selectedComparison) !== '-'
                    ? `${getItemCount(selectedComparison)} items were compared.`
                    : 'Re-seed demo data to see item details.'}
                </p>
              </div>
            )}

            {/* Store Comparison */}
            {selectedComparison.results?.stores && selectedComparison.results.stores.length > 0 && (
              <>
                <h3 className="text-lg font-bold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Store Comparison</h3>
                <div className="space-y-2">
                  {selectedComparison.results.stores.map((store, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center rounded-lg p-3 ${
                        store.name === selectedComparison.best_option?.store?.name
                          ? 'bg-green-500/15 border border-green-500/30'
                          : ''
                      }`}
                      style={store.name !== selectedComparison.best_option?.store?.name ? { backgroundColor: 'var(--bg-secondary)' } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'var(--text-primary)' }}>{store.name}</span>
                        {store.name === selectedComparison.best_option?.store?.name && (
                          <span className="text-xs px-2 py-0.5 bg-green-500 text-black rounded-full font-bold">
                            BEST
                          </span>
                        )}
                      </div>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${store.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setSelectedComparison(null)}
              className="w-full mt-6 px-4 py-3 rounded-lg font-medium transition hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
