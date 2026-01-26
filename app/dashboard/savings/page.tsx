import { createServerClient } from '@/lib/supabase/server'

async function getSavingsData() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: savings } = await supabase
    .from('user_savings')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: false })
    .limit(6)

  return savings || []
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

export default async function SavingsPage() {
  const savings = await getSavingsData() as SavingsRecord[] | null

  const totalLifetime = savings?.reduce((sum: number, s: SavingsRecord) => sum + (s.total_saved || 0), 0) || 0
  const avgPerTrip = savings?.[0]?.avg_savings_per_trip || 0
  const projectedAnnual = (avgPerTrip * 4 * 12) || 0

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Savings Tracker</h1>
      </div>

      <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Monthly Savings (Last 6 Months)</h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {savings && savings.length > 0 ? (
            (() => {
              const maxSavings = Math.max(...savings.map((x: SavingsRecord) => x.total_saved || 1), 1)
              return savings.map((s: SavingsRecord, idx: number) => {
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
                      {new Date(s.month).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                )
              })
            })()
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No savings data yet</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Total Lifetime Savings</div>
          <div className="text-5xl font-black text-green-500">
            ${totalLifetime.toFixed(2)}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Average Per Shopping Trip</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${avgPerTrip.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Projected Annual Savings</div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${projectedAnnual.toFixed(0)}</div>
        </div>
      </div>
    </div>
  )
}


