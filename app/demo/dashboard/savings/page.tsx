'use client'

import { useState, useEffect } from 'react'
import { DEMO_MONTHLY_SAVINGS } from '@/lib/demo/data/user-dashboard'
import { getChainByName } from '@/lib/demo/data/grocery-chains'

// ── Inline mock types & data (no API calls) ────────────────────────────

interface SavingsRecord {
  id: string
  user_id: string
  month: string
  total_spent: number | null
  total_saved: number | null
  trips_count: number | null
  avg_savings_per_trip: number | null
  created_at: string
}

interface ShoppingTrip {
  id: string
  store_name: string
  store_retailer: string | null
  store_address: string | null
  shopping_method: string
  delivery_partner: string | null
  items_count: number
  estimated_total: number
  estimated_savings: number
  created_at: string
}

// Helper to get a date string N days ago
function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// Helper to get a month ISO string N months ago (1st of that month)
function monthIso(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(1)
  return d.toISOString()
}

// 6 months of savings records (matches DEMO_MONTHLY_SAVINGS values)
const MOCK_SAVINGS: SavingsRecord[] = [
  { id: 's-1', user_id: 'demo', month: monthIso(5), total_spent: 524.30, total_saved: 112.48, trips_count: 9,  avg_savings_per_trip: 12.50, created_at: monthIso(5) },
  { id: 's-2', user_id: 'demo', month: monthIso(4), total_spent: 487.15, total_saved: 98.76,  trips_count: 8,  avg_savings_per_trip: 12.35, created_at: monthIso(4) },
  { id: 's-3', user_id: 'demo', month: monthIso(3), total_spent: 612.80, total_saved: 145.20, trips_count: 11, avg_savings_per_trip: 13.20, created_at: monthIso(3) },
  { id: 's-4', user_id: 'demo', month: monthIso(2), total_spent: 558.42, total_saved: 134.59, trips_count: 10, avg_savings_per_trip: 13.46, created_at: monthIso(2) },
  { id: 's-5', user_id: 'demo', month: monthIso(1), total_spent: 593.67, total_saved: 167.83, trips_count: 12, avg_savings_per_trip: 13.99, created_at: monthIso(1) },
  { id: 's-6', user_id: 'demo', month: monthIso(0), total_spent: 631.20, total_saved: 188.46, trips_count: 14, avg_savings_per_trip: 13.46, created_at: monthIso(0) },
]

// 18 shopping trips – mix of delivery and in-store
const MOCK_TRIPS: ShoppingTrip[] = [
  { id: 't-01', store_name: 'ALDI',    store_retailer: 'ALDI',    store_address: '123 Main St',   shopping_method: 'in-store', delivery_partner: null,        items_count: 12, estimated_total: 67.43,  estimated_savings: 8.47,  created_at: daysAgo(0) },
  { id: 't-02', store_name: 'Walmart',  store_retailer: 'Walmart',  store_address: '456 Oak Ave',   shopping_method: 'delivery', delivery_partner: 'Instacart', items_count: 8,  estimated_total: 89.17,  estimated_savings: 5.23,  created_at: daysAgo(1) },
  { id: 't-03', store_name: 'Kroger',   store_retailer: 'Kroger',   store_address: '789 Elm Blvd',  shopping_method: 'in-store', delivery_partner: null,        items_count: 15, estimated_total: 112.86, estimated_savings: 12.80, created_at: daysAgo(3) },
  { id: 't-04', store_name: 'Target',   store_retailer: 'Target',   store_address: '321 Pine Rd',   shopping_method: 'delivery', delivery_partner: 'Shipt',     items_count: 6,  estimated_total: 52.86,  estimated_savings: 3.15,  created_at: daysAgo(5) },
  { id: 't-05', store_name: 'ALDI',    store_retailer: 'ALDI',    store_address: '123 Main St',   shopping_method: 'in-store', delivery_partner: null,        items_count: 20, estimated_total: 94.50,  estimated_savings: 15.62, created_at: daysAgo(7) },
  { id: 't-06', store_name: 'Publix',   store_retailer: 'Publix',   store_address: '555 Beach Dr',  shopping_method: 'in-store', delivery_partner: null,        items_count: 9,  estimated_total: 74.52,  estimated_savings: 6.94,  created_at: daysAgo(10) },
  { id: 't-07', store_name: 'Walmart',  store_retailer: 'Walmart',  store_address: '456 Oak Ave',   shopping_method: 'delivery', delivery_partner: 'Instacart', items_count: 11, estimated_total: 83.29,  estimated_savings: 7.38,  created_at: daysAgo(12) },
  { id: 't-08', store_name: 'Kroger',   store_retailer: 'Kroger',   store_address: '789 Elm Blvd',  shopping_method: 'in-store', delivery_partner: null,        items_count: 7,  estimated_total: 58.24,  estimated_savings: 4.21,  created_at: daysAgo(14) },
  { id: 't-09', store_name: 'ALDI',    store_retailer: 'ALDI',    store_address: '123 Main St',   shopping_method: 'delivery', delivery_partner: 'Instacart', items_count: 14, estimated_total: 76.18,  estimated_savings: 9.84,  created_at: daysAgo(16) },
  { id: 't-10', store_name: 'Target',   store_retailer: 'Target',   store_address: '321 Pine Rd',   shopping_method: 'in-store', delivery_partner: null,        items_count: 5,  estimated_total: 41.30,  estimated_savings: 2.75,  created_at: daysAgo(18) },
  { id: 't-11', store_name: 'Walmart',  store_retailer: 'Walmart',  store_address: '456 Oak Ave',   shopping_method: 'in-store', delivery_partner: null,        items_count: 10, estimated_total: 72.65,  estimated_savings: 6.10,  created_at: daysAgo(20) },
  { id: 't-12', store_name: 'Kroger',   store_retailer: 'Kroger',   store_address: '789 Elm Blvd',  shopping_method: 'delivery', delivery_partner: 'Instacart', items_count: 9,  estimated_total: 65.47,  estimated_savings: 5.50,  created_at: daysAgo(22) },
  { id: 't-13', store_name: 'Publix',   store_retailer: 'Publix',   store_address: '555 Beach Dr',  shopping_method: 'in-store', delivery_partner: null,        items_count: 13, estimated_total: 98.34,  estimated_savings: 11.20, created_at: daysAgo(25) },
  { id: 't-14', store_name: 'ALDI',    store_retailer: 'ALDI',    store_address: '123 Main St',   shopping_method: 'in-store', delivery_partner: null,        items_count: 8,  estimated_total: 53.90,  estimated_savings: 7.15,  created_at: daysAgo(28) },
  { id: 't-15', store_name: 'Walmart',  store_retailer: 'Walmart',  store_address: '456 Oak Ave',   shopping_method: 'delivery', delivery_partner: 'DoorDash',  items_count: 16, estimated_total: 105.72, estimated_savings: 8.93,  created_at: daysAgo(30) },
  { id: 't-16', store_name: 'Kroger',   store_retailer: 'Kroger',   store_address: '789 Elm Blvd',  shopping_method: 'in-store', delivery_partner: null,        items_count: 11, estimated_total: 79.41,  estimated_savings: 6.82,  created_at: daysAgo(33) },
  { id: 't-17', store_name: 'Target',   store_retailer: 'Target',   store_address: '321 Pine Rd',   shopping_method: 'in-store', delivery_partner: null,        items_count: 7,  estimated_total: 48.62,  estimated_savings: 3.40,  created_at: daysAgo(36) },
  { id: 't-18', store_name: 'Publix',   store_retailer: 'Publix',   store_address: '555 Beach Dr',  shopping_method: 'delivery', delivery_partner: 'Instacart', items_count: 10, estimated_total: 86.15,  estimated_savings: 9.25,  created_at: daysAgo(40) },
]

// ── StoreLogo component ────────────────────────────────────────────────

function StoreLogo({ name, size = 32 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const chain = getChainByName(name)
  const domain = chain?.domain
  const color = chain?.color || '#22c55e'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (failed || !domain) {
    return (
      <div
        className="rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color, width: size, height: size }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg object-contain flex-shrink-0"
      style={{ backgroundColor: '#fff', width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

// ── Page component ─────────────────────────────────────────────────────

export default function DemoSavingsPage() {
  const [savings, setSavings] = useState<SavingsRecord[]>([])
  const [trips, setTrips] = useState<ShoppingTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate a brief load so the loading state renders identically to the real page
    const timer = setTimeout(() => {
      setSavings(MOCK_SAVINGS)
      setTrips(MOCK_TRIPS)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const totalLifetime = savings.reduce((sum, s) => sum + (s.total_saved || 0), 0)
  const totalTrips = savings.reduce((sum, s) => sum + (s.trips_count || 0), 0)
  const avgPerTrip = totalTrips > 0 ? totalLifetime / totalTrips : 0
  const projectedAnnual = avgPerTrip * 4 * 12

  // Compute store breakdown from recent trips
  const storeBreakdown: Record<string, { count: number; totalSpent: number }> = {}
  trips.forEach(trip => {
    const key = trip.store_name
    if (!storeBreakdown[key]) {
      storeBreakdown[key] = { count: 0, totalSpent: 0 }
    }
    storeBreakdown[key].count++
    storeBreakdown[key].totalSpent += trip.estimated_total || 0
  })
  const topStores = Object.entries(storeBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading savings data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Savings & Activity</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Lifetime Savings</div>
          <div className="text-3xl font-black text-green-500">${totalLifetime.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Avg Per Trip</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${avgPerTrip.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Trips</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{totalTrips}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Projected Annual</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${projectedAnnual.toFixed(0)}</div>
        </div>
      </div>

      {/* Monthly Savings Chart */}
      <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Monthly Savings</h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {savings.length > 0 ? (
            (() => {
              const reversed = [...savings].reverse()
              const maxSavings = Math.max(...reversed.map(x => x.total_saved || 1), 1)
              return reversed.map((s, idx) => {
                const heightPercent = Math.max(((s.total_saved || 0) / maxSavings) * 100, 10)
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '85%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-500 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                      >
                        <div className="text-center text-xs text-white font-bold pt-1">
                          ${(s.total_saved || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      {(() => {
                        try {
                          const monthDate = new Date(s.month)
                          return isNaN(monthDate.getTime())
                            ? s.month
                            : monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                        } catch {
                          return s.month || 'N/A'
                        }
                      })()}
                    </div>
                  </div>
                )
              })
            })()
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              No savings data yet. Start by comparing prices and shopping!
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Recent Shopping Activity */}
        <div className="md:col-span-2 rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
          {trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-4">
                    <StoreLogo name={trip.store_name} size={40} />
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.store_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {trip.shopping_method === 'delivery' && trip.delivery_partner
                          ? `Delivery via ${trip.delivery_partner}`
                          : 'In-store'}
                        {' '}&middot; {trip.items_count} items &middot; {formatDate(trip.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>${trip.estimated_total.toFixed(2)}</div>
                    {trip.estimated_savings > 0 && (
                      <div className="text-xs text-green-500">Saved ${trip.estimated_savings.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <p className="text-lg mb-2">No shopping activity yet</p>
              <p className="text-sm">Click &quot;Shop Here&quot; or &quot;Directions&quot; on the Compare Prices page to start tracking</p>
            </div>
          )}
        </div>

        {/* Store Breakdown */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Top Stores</h3>
          {topStores.length > 0 ? (
            <div className="space-y-4">
              {topStores.map(([name, data], idx) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StoreLogo name={name} size={32} />
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.count} visit{data.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    ${data.totalSpent.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No store data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
