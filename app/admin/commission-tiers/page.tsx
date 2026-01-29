'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CommissionTiersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tiers, setTiers] = useState<any[]>([])
  const [storesByTier, setStoresByTier] = useState<any[]>([])

  useEffect(() => {
    loadTiers()
  }, [])

  const loadTiers = async () => {
    try {
      const supabase = createClient()


      // Fetch all commission tiers
      const { data: tiersData, error: fetchError } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('commission_percentage', { ascending: false })

      if (fetchError) {
        console.error('Fetch tiers error:', fetchError)
      }

      const allTiers = tiersData || []
      setTiers(allTiers)

      // Get store count per tier
      const { data: storeOwners } = await supabase
        .from('store_owners')
        .select('id, commission_rate')
        .eq('application_status', 'approved')

      const tierCounts = allTiers.map((tier: any) => ({
        ...tier,
        storeCount: storeOwners?.filter((s: any) => Math.abs(parseFloat(s.commission_rate) - tier.commission_percentage) < 0.01).length || 0
      }))

      setStoresByTier(tierCounts);
    } catch (error) {
      console.error('Error loading tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading commission tiers...</div>
        </div>
      </div>
    )
  }

  const allTiers = tiers || []
  const activeTiers = allTiers.filter((t: any) => t.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Commission Tiers</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Configure pricing tiers for store owners
          </p>
        </div>
        <button
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Add New Tier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Tiers</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            {allTiers.length}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Active Tiers</div>
          <div className="text-4xl font-black text-green-500">
            {activeTiers.length}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Stores Using Tiers</div>
          <div className="text-4xl font-black text-blue-500">
            {storesByTier.reduce((sum, t) => sum + t.storeCount, 0)}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Default Rate</div>
          <div className="text-4xl font-black text-purple-500">
            {allTiers.find((t: any) => t.is_default)?.commission_percentage || 15}%
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storesByTier.map((tier: any) => (
          <div
            key={tier.id}
            className="rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: tier.is_default ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{tier.name}</h3>
                  {tier.is_default && (
                    <span className="px-2 py-1 text-xs font-black rounded-full bg-green-500 text-black">
                      Default
                    </span>
                  )}
                  {!tier.is_active && (
                    <span className="px-2 py-1 text-xs font-black rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                      Inactive
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{tier.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-green-500">
                  {tier.commission_percentage}%
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Commission</div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2 mb-4">
              {tier.min_monthly_orders > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Minimum {tier.min_monthly_orders} orders/month
                </div>
              )}
              {parseFloat(tier.min_monthly_revenue) > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Minimum ${parseFloat(tier.min_monthly_revenue).toFixed(0)}/month revenue
                </div>
              )}
            </div>

            {/* Features */}
            {tier.features && Array.isArray(tier.features) && tier.features.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-black uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Benefits</div>
                <div className="space-y-1">
                  {tier.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store Count */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Stores on this tier:</span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{tier.storeCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 text-sm font-semibold bg-green-500 text-black rounded-lg hover:bg-green-600 transition">
                Edit
              </button>
              {!tier.is_default && (
                <button className="px-4 py-2 text-sm font-semibold rounded-lg transition" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                  {tier.is_active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-black mb-2" style={{ color: 'var(--text-primary)' }}>How Commission Tiers Work</h4>
            <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--text-secondary)' }}>
              <li>New stores automatically get the default tier rate</li>
              <li>Stores meeting higher tier requirements can be upgraded manually</li>
              <li>Commission is calculated as a percentage of the order subtotal (before tax and delivery)</li>
              <li>Lower commission rates incentivize high-volume stores</li>
              <li>Changes to tier rates do not affect existing orders, only new orders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Calculation */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Example Commission Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { rate: 15, name: 'Default (15%)' },
            { rate: 12, name: 'Silver (12%)' },
            { rate: 10, name: 'Gold (10%)' },
          ].map(({ rate, name }: { rate: number; name: string }) => (
            <div key={rate} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)' }}>
              <div className="text-center mb-3">
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{name}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Order Subtotal:</span>
                  <span className="font-black" style={{ color: 'var(--text-primary)' }}>$50.00</span>
                </div>
                <div className="flex justify-between text-purple-500">
                  <span>Commission ({rate}%):</span>
                  <span className="font-black">-${(50 * rate / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 font-black" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Store Payout:</span>
                  <span className="text-green-500">${(50 * (1 - rate / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
