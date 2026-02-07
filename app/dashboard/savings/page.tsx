'use client'

import { useState, useEffect } from 'react'
import { getChainByName } from '@/lib/demo/data/grocery-chains'

function StoreLogo({ name, size = 32 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const chain = getChainByName(name)
  const domain = chain?.domain
  const color = chain?.color || '#22c55e'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  if (failed || !domain) {
    return (
      <div className="rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: color, width: size, height: size }}>
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
      } catch {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

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

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingsRecord[]>([])
  const [trips, setTrips] = useState<ShoppingTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders()
        const [savingsRes, tripsRes] = await Promise.all([
          fetch('/api/savings', { headers }),
          fetch('/api/shopping-trips?limit=20', { headers }),
        ])

        if (savingsRes.ok) {
          const data = await savingsRes.json()
          setSavings(data.savings || [])
        }

        if (tripsRes.ok) {
          const data = await tripsRes.json()
          setTrips(data.trips || [])
        }
      } catch (error) {
        console.error('Failed to load savings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
