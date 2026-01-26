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

interface Comparison {
  id: string
  created_at: string
  total_savings?: number
  total_spent?: number
  best_store?: string
  item_count?: number
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
            </tr>
          </thead>
          <tbody>
            {comparisons.length > 0 ? (
              comparisons.map((comp) => (
                <tr key={comp.id} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4">{new Date(comp.created_at).toLocaleDateString()}</td>
                  <td className="p-4">{comp.item_count || '-'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                      {comp.best_store || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 font-bold">
                    ${(comp.total_spent || 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-green-500 font-bold">
                    ${(comp.total_savings || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No comparisons yet. Start comparing prices to see your savings!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

