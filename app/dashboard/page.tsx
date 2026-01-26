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
  name: string
  price?: number
  quantity?: number
}

interface Comparison {
  id: string
  created_at: string
  total_savings?: number
  best_option?: {
    store?: { name?: string; retailer?: string }
    total?: number
    items?: ComparisonItem[]
  } | null
  results?: {
    summary?: {
      totalItems?: number
      itemsFound?: number
    }
    stores?: Array<{
      name: string
      total: number
      items?: ComparisonItem[]
    }>
    items?: ComparisonItem[]
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
    // Try results.summary first
    if (comp.results?.summary?.totalItems) return comp.results.summary.totalItems
    if (comp.results?.summary?.itemsFound) return comp.results.summary.itemsFound
    // Try best_option.items
    if (comp.best_option?.items?.length) return comp.best_option.items.length
    // Try results.items
    if (comp.results?.items?.length) return comp.results.items.length
    // Try first store's items
    if (comp.results?.stores?.[0]?.items?.length) return comp.results.stores[0].items.length
    return '-'
  }

  // Helper to get items from comparison for modal
  const getComparisonItems = (comp: Comparison): ComparisonItem[] => {
    if (comp.best_option?.items?.length) return comp.best_option.items
    if (comp.results?.items?.length) return comp.results.items
    if (comp.results?.stores?.[0]?.items?.length) return comp.results.stores[0].items
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
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black mb-2">My Dashboard</h1>
          <p className="text-gray-500 text-sm">
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
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
          <div className="text-sm text-gray-500 mb-4">Total Savings This Month</div>
          <div className="text-5xl font-black text-green-500 mb-2">
            ${(savings.total_saved || 0).toFixed(2)}
          </div>
          {hasHistoricalData && prevSavingsTotal > 0 ? (
            formatTrend(savings.total_saved, prevSavingsTotal, true)
          ) : (
            <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
              No historical data
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
          <div className="text-sm text-gray-500 mb-4">Comparisons Run</div>
          <div className="text-5xl font-black mb-2">{comparisons.length}</div>
          {hasHistoricalData && prevComparisons > 0 ? (
            formatTrend(comparisons.length, prevComparisons, false)
          ) : (
            <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
              No historical data
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
          <div className="text-sm text-gray-500 mb-4">Receipts Scanned</div>
          <div className="text-5xl font-black mb-2">{receiptsCount}</div>
          {hasHistoricalData && prevReceipts > 0 ? (
            formatTrend(receiptsCount, prevReceipts, false)
          ) : (
            <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
              No historical data
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-green-500 transition">
          <div className="text-sm text-gray-500 mb-4">Average Savings Per Trip</div>
          <div className="text-3xl font-black mb-2">
            ${(savings.avg_savings_per_trip || 0).toFixed(2)}
          </div>
          {hasHistoricalData && prevAvgSavings > 0 ? (
            formatTrend(savings.avg_savings_per_trip, prevAvgSavings, true)
          ) : (
            <span className="inline-block px-3 py-1 bg-gray-800 text-gray-500 rounded-lg text-sm">
              No historical data
            </span>
          )}
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-6">Recent Comparisons</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Date</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Items</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Best Store</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Total</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Savings</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.length > 0 ? (
              comparisons.map((comp) => {
                const bestStore = comp.best_option?.store?.name || 'N/A'
                const itemCount = getItemCount(comp)
                const total = comp.best_option?.total || 0
                const hasItems = getComparisonItems(comp).length > 0

                return (
                  <tr key={comp.id} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4">{new Date(comp.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{itemCount}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                        {bestStore}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      ${total.toFixed(2)}
                    </td>
                    <td className="p-4 text-green-500 font-bold">
                      ${(comp.total_savings || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedComparison(comp)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Comparison Details</h2>
                <p className="text-gray-500">
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
                className="text-gray-500 hover:text-white transition p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Best Store</div>
                <div className="text-green-500 font-bold">
                  {selectedComparison.best_option?.store?.name || 'N/A'}
                </div>
              </div>
              <div className="bg-black rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Total</div>
                <div className="font-bold text-xl">
                  ${(selectedComparison.best_option?.total || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-black rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Savings</div>
                <div className="text-green-500 font-bold text-xl">
                  ${(selectedComparison.total_savings || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Items List */}
            <h3 className="text-lg font-bold mb-4">Items Compared</h3>
            {getComparisonItems(selectedComparison).length > 0 ? (
              <div className="space-y-2">
                {getComparisonItems(selectedComparison).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-gray-500 text-sm">x{item.quantity}</span>
                      )}
                    </div>
                    {item.price && (
                      <span className="font-medium">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black rounded-xl p-6 text-center text-gray-500">
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
                <h3 className="text-lg font-bold mb-4 mt-6">Store Comparison</h3>
                <div className="space-y-2">
                  {selectedComparison.results.stores.map((store, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center rounded-lg p-3 ${
                        store.name === selectedComparison.best_option?.store?.name
                          ? 'bg-green-500/15 border border-green-500/30'
                          : 'bg-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{store.name}</span>
                        {store.name === selectedComparison.best_option?.store?.name && (
                          <span className="text-xs px-2 py-0.5 bg-green-500 text-black rounded-full font-bold">
                            BEST
                          </span>
                        )}
                      </div>
                      <span className="font-bold">${store.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setSelectedComparison(null)}
              className="w-full mt-6 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
