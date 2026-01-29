'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SavingsData {
  total_saved: number
  total_spent: number
  trips_count: number
  avg_savings_per_trip: number
  month?: string
}

interface MonthlyData {
  month: string
  total_saved: number
  total_spent: number
  trips_count: number
}

interface StoreStats {
  store_name: string
  total_savings: number
  comparison_count: number
  avg_savings: number
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
  const router = useRouter()
  const [savings, setSavings] = useState<SavingsData>({
    total_saved: 0,
    total_spent: 0,
    trips_count: 0,
    avg_savings_per_trip: 0,
  })
  const [previousMonthSavings, setPreviousMonthSavings] = useState<SavingsData | null>(null)
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [allComparisons, setAllComparisons] = useState<Comparison[]>([])
  const [receiptsCount, setReceiptsCount] = useState(0)
  const [currentComparisonsCount, setCurrentComparisonsCount] = useState(0)
  const [previousComparisonsCount, setPreviousComparisonsCount] = useState(0)
  const [previousReceiptsCount, setPreviousReceiptsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [hasHistoricalData, setHasHistoricalData] = useState(false)
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null)

  // New features state
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [storeStats, setStoreStats] = useState<StoreStats[]>([])
  const [yearToDateSavings, setYearToDateSavings] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStore, setFilterStore] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

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

        // Get recent comparisons (for display)
        const { data: comparisonsData } = await supabase
          .from('comparisons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        // Get all comparisons (for filtering and export)
        const { data: allComparisonsData } = await supabase
          .from('comparisons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Get current month comparisons count
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)

        const previousMonthStart = new Date(currentMonthStart)
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)

        const previousMonthEnd = new Date(currentMonthStart)
        previousMonthEnd.setSeconds(previousMonthEnd.getSeconds() - 1)

        // Get current month comparisons count
        const { count: currentComparisons } = await supabase
          .from('comparisons')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', currentMonthStart.toISOString())

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

        // Get last 6 months of savings data for chart
        const { data: last6Months } = await supabase
          .from('user_savings')
          .select('*')
          .eq('user_id', user.id)
          .order('month', { ascending: false })
          .limit(6)

        // Get year-to-date savings
        const yearStart = new Date()
        yearStart.setMonth(0, 1)
        yearStart.setHours(0, 0, 0, 0)

        const { data: ytdData } = await supabase
          .from('user_savings')
          .select('total_saved')
          .eq('user_id', user.id)
          .gte('month', yearStart.toISOString().substring(0, 7))

        const ytdTotal = ytdData?.reduce((sum: number, month: any) => sum + (month.total_saved || 0), 0) || 0

        // Calculate store statistics from comparisons
        const storeStatsMap = new Map<string, { totalSavings: number; count: number }>()

        allComparisonsData?.forEach((comp: any) => {
          const storeName = comp.best_option?.store?.name || comp.best_option?.store?.retailer
          const savings = comp.total_savings || 0

          if (storeName) {
            const existing = storeStatsMap.get(storeName) || { totalSavings: 0, count: 0 }
            storeStatsMap.set(storeName, {
              totalSavings: existing.totalSavings + savings,
              count: existing.count + 1,
            })
          }
        })

        const calculatedStoreStats: StoreStats[] = Array.from(storeStatsMap.entries())
          .map(([name, data]) => ({
            store_name: name,
            total_savings: data.totalSavings,
            comparison_count: data.count,
            avg_savings: data.totalSavings / data.count,
          }))
          .sort((a, b) => b.total_savings - a.total_savings)
          .slice(0, 5)

        setSavings(
          currentSavings || {
            total_saved: 0,
            total_spent: 0,
            trips_count: 0,
            avg_savings_per_trip: 0,
          }
        )
        setComparisons(comparisonsData || [])
        setAllComparisons(allComparisonsData || [])
        setReceiptsCount(receipts || 0)
        setCurrentComparisonsCount(currentComparisons || 0)
        setPreviousComparisonsCount(prevComparisons || 0)
        setPreviousReceiptsCount(prevReceipts || 0)
        setMonthlyData(
          last6Months?.map((m: any) => ({
            month: m.month || '',
            total_saved: m.total_saved || 0,
            total_spent: m.total_spent || 0,
            trips_count: m.trips_count || 0,
          })).reverse() || []
        )
        setStoreStats(calculatedStoreStats)
        setYearToDateSavings(ytdTotal)
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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Items', 'Best Store', 'Total', 'Savings']
    const rows = allComparisons.map((comp) => {
      const storeName = comp.best_option?.store?.name || 'N/A'
      return [
        new Date(comp.created_at).toLocaleDateString(),
        getItemCount(comp).toString(),
        storeName.includes(',') ? `"${storeName}"` : storeName,
        (comp.best_option?.total || 0).toFixed(2),
        (comp.total_savings || 0).toFixed(2),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `julyu-comparisons-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter and paginate comparisons
  const filteredComparisons = allComparisons.filter((comp) => {
    const matchesSearch = searchTerm === '' ||
      (comp.best_option?.store?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(comp.created_at).toLocaleDateString().includes(searchTerm)

    const matchesStore = filterStore === '' ||
      (comp.best_option?.store?.name || '') === filterStore

    return matchesSearch && matchesStore
  })

  const totalPages = Math.ceil(filteredComparisons.length / itemsPerPage)
  const paginatedComparisons = filteredComparisons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique stores for filter dropdown
  const uniqueStores = Array.from(
    new Set(allComparisons.map((c) => c.best_option?.store?.name).filter(Boolean))
  ) as string[]

  // Best shopping day analysis
  const dayStats = new Map<string, { count: number; savings: number }>()
  allComparisons.forEach((comp) => {
    const day = new Date(comp.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    const existing = dayStats.get(day) || { count: 0, savings: 0 }
    dayStats.set(day, {
      count: existing.count + 1,
      savings: existing.savings + (comp.total_savings || 0),
    })
  })

  const bestDay = Array.from(dayStats.entries())
    .sort((a, b) => b[1].savings - a[1].savings)[0]

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
      <div className="flex justify-between items-center mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard/compare')}
          className="p-6 rounded-2xl transition hover:opacity-80 flex items-center justify-between"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'black' }}
        >
          <div className="text-left">
            <div className="text-lg font-bold">New Comparison</div>
            <div className="text-sm opacity-80">Compare prices now</div>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={exportToCSV}
          className="p-6 rounded-2xl transition hover:opacity-80 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-left">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Export Data</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Download CSV</div>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/dashboard/settings')}
          className="p-6 rounded-2xl transition hover:opacity-80 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-left">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Settings</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage preferences</div>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Year-to-Date Banner */}
      {yearToDateSavings > 0 && (
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #10b981 100%)' }}>
          <div className="text-sm font-semibold text-black/70 mb-2">Year-to-Date Savings</div>
          <div className="text-6xl font-black text-black mb-2">
            ${yearToDateSavings.toFixed(2)}
          </div>
          <div className="text-black/70">
            Keep it up! You&apos;re saving money every month.
          </div>
        </div>
      )}

      {/* Monthly Savings Chart */}
      {monthlyData.length > 0 && (
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Savings Trend (Last 6 Months)</h2>
          <div className="relative h-64">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={40 + i * 40}
                  x2="580"
                  y2={40 + i * 40}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              {/* Chart line */}
              {monthlyData.length > 1 && (
                <>
                  <polyline
                    points={monthlyData
                      .map((data, i) => {
                        const maxSavings = Math.max(...monthlyData.map((d) => d.total_saved), 100)
                        const x = 40 + (i * (540 / (monthlyData.length - 1)))
                        const y = 200 - ((data.total_saved / maxSavings) * 160) - 20
                        return `${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="3"
                  />
                  {/* Data points */}
                  {monthlyData.map((data, i) => {
                    const maxSavings = Math.max(...monthlyData.map((d) => d.total_saved), 100)
                    const x = 40 + (i * (540 / (monthlyData.length - 1)))
                    const y = 200 - ((data.total_saved / maxSavings) * 160) - 20
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="var(--accent-primary)"
                          stroke="var(--bg-card)"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y="195"
                          textAnchor="middle"
                          fontSize="11"
                          fill="var(--text-muted)"
                        >
                          {new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </text>
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                          fill="var(--accent-primary)"
                        >
                          ${data.total_saved.toFixed(0)}
                        </text>
                      </g>
                    )
                  })}
                </>
              )}
            </svg>
          </div>
        </div>
      )}

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
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Comparisons Run This Month</div>
          <div className="text-5xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{currentComparisonsCount}</div>
          {hasHistoricalData && prevComparisons > 0 ? (
            formatTrend(currentComparisonsCount, prevComparisons, false)
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

      {/* Store Performance & Best Shopping Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Store Performance Insights */}
        {storeStats.length > 0 && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Performing Stores</h2>
            <div className="space-y-3">
              {storeStats.map((store, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.store_name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {store.comparison_count} {store.comparison_count === 1 ? 'comparison' : 'comparisons'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                      ${store.total_savings.toFixed(2)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ${store.avg_savings.toFixed(2)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Shopping Days */}
        {bestDay && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Shopping Insights</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Best Day to Shop</div>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent-primary)' }}>
                  {bestDay[0]}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  ${bestDay[1].savings.toFixed(2)} total savings on {bestDay[0]}s
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total Comparisons</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {allComparisons.length}
                  </div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Avg Per Trip</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    ${(savings.avg_savings_per_trip || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Comparisons</h2>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by store or date..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <select
          value={filterStore}
          onChange={(e) => {
            setFilterStore(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-3 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Stores</option>
          {uniqueStores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
        {(searchTerm || filterStore) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStore('')
              setCurrentPage(1)
            }}
            className="px-6 py-3 rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
          >
            Clear Filters
          </button>
        )}
      </div>
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
            {paginatedComparisons.length > 0 ? (
              paginatedComparisons.map((comp) => {
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
                  {searchTerm || filterStore
                    ? 'No comparisons match your filters.'
                    : 'No comparisons yet. Start comparing prices to see your savings!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg transition ${
                      currentPage === page ? 'font-bold' : ''
                    }`}
                    style={{
                      backgroundColor: currentPage === page ? 'var(--accent-primary)' : 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: currentPage === page ? 'black' : 'var(--text-primary)',
                    }}
                  >
                    {page}
                  </button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="w-10 h-10 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {paginatedComparisons.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
        {Math.min(currentPage * itemsPerPage, filteredComparisons.length)} of {filteredComparisons.length}{' '}
        {searchTerm || filterStore ? 'filtered' : 'total'} comparisons
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
                  {selectedComparison.results.stores.map((store, idx) => {
                    const storeName = store.name || store.storeName || 'Unknown Store'
                    const bestStoreName = selectedComparison.best_option?.store?.name || selectedComparison.best_option?.store?.retailer
                    const isBest = storeName === bestStoreName

                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-center rounded-lg p-3 ${
                          isBest
                            ? 'bg-green-500/15 border border-green-500/30'
                            : ''
                        }`}
                        style={!isBest ? { backgroundColor: 'var(--bg-secondary)' } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ color: 'var(--text-primary)' }}>{storeName}</span>
                          {isBest && (
                            <span className="text-xs px-2 py-0.5 bg-green-500 text-black rounded-full font-bold">
                              BEST
                            </span>
                          )}
                        </div>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${store.total.toFixed(2)}</span>
                      </div>
                    )
                  })}
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
