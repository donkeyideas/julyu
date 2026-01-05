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
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">Savings Tracker</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <h3 className="text-2xl font-bold mb-8">Monthly Savings (Last 6 Months)</h3>
        <div className="flex items-end justify-between gap-4 h-64">
          {savings && savings.length > 0 ? (
            savings.map((s: SavingsRecord, idx: number) => {
              const maxSavings = Math.max(...savings.map((x: SavingsRecord) => x.total_saved || 1))
              const height = ((s.total_saved || 0) / maxSavings) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-500 rounded-t transition hover:opacity-80"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {new Date(s.month).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="w-full text-center text-gray-500">No savings data yet</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Total Lifetime Savings</div>
          <div className="text-5xl font-black text-green-500">
            ${totalLifetime.toFixed(2)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Average Per Shopping Trip</div>
          <div className="text-3xl font-black">${avgPerTrip.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-4">Projected Annual Savings</div>
          <div className="text-3xl font-black">${projectedAnnual.toFixed(0)}</div>
        </div>
      </div>
    </div>
  )
}


