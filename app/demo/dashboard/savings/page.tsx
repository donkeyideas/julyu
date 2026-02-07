'use client'

// Inline mock data for savings page
function monthName(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toLocaleString('en-US', { month: 'short' })
}

function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const MONTHLY_DATA = [
  { month: monthName(5), saved: 112.48, spent: 524.30 },
  { month: monthName(4), saved: 98.76, spent: 487.15 },
  { month: monthName(3), saved: 145.20, spent: 612.80 },
  { month: monthName(2), saved: 134.59, spent: 558.42 },
  { month: monthName(1), saved: 167.83, spent: 593.67 },
  { month: monthName(0), saved: 188.46, spent: 631.20 },
]

const maxSaved = Math.max(...MONTHLY_DATA.map(m => m.saved))

const RECENT_TRIPS = [
  { store: 'Kroger', date: daysAgoStr(1), amount: 67.43, savings: 8.47 },
  { store: 'Walmart', date: daysAgoStr(3), amount: 89.17, savings: 5.23 },
  { store: 'Target', date: daysAgoStr(5), amount: 52.86, savings: 3.92 },
  { store: 'Publix', date: daysAgoStr(7), amount: 74.52, savings: 12.80 },
  { store: 'Kroger', date: daysAgoStr(10), amount: 58.24, savings: 6.15 },
]

export default function DemoSavingsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Savings & Activity</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Track your grocery savings and shopping activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Saved</div>
          <div className="text-3xl font-bold" style={{ color: '#22c55e' }}>$847.32</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Last 6 months</div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Spent</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>$4,234.56</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Last 6 months</div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Shopping Trips</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>156</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Last 6 months</div>
        </div>
      </div>

      {/* Monthly Savings Chart (CSS-only bar chart) */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Monthly Savings</h2>

        <div className="flex items-end gap-4 h-48">
          {MONTHLY_DATA.map((m, i) => {
            const heightPct = (m.saved / maxSaved) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-sm font-bold mb-1" style={{ color: '#22c55e' }}>
                  ${m.saved.toFixed(0)}
                </div>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: '#22c55e',
                    minHeight: '8px',
                    opacity: 0.7 + (i * 0.05),
                  }}
                />
                <div
                  className="text-xs font-semibold mt-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.month}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
            Savings
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
        <div className="space-y-3">
          {RECENT_TRIPS.map((trip, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                >
                  {trip.store[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {trip.store}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{trip.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  ${trip.amount.toFixed(2)}
                </div>
                <div className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                  Saved ${trip.savings.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
