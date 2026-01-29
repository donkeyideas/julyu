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
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading commission tiers...</div>
        </div>
      </div>
    )
  }

  const allTiers = tiers || []
  const activeTiers = allTiers.filter((t: any) => t.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Commission Tiers</h1>
          <p className="text-gray-500 mt-2">
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
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Total Tiers</div>
          <div className="text-4xl font-black">
            {allTiers.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Active Tiers</div>
          <div className="text-4xl font-black text-green-500">
            {activeTiers.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Stores Using Tiers</div>
          <div className="text-4xl font-black text-blue-500">
            {storesByTier.reduce((sum, t) => sum + t.storeCount, 0)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
          <div className="text-sm text-gray-500 mb-2">Default Rate</div>
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
            className={`bg-gradient-to-br from-gray-900 to-black rounded-2xl border p-6 ${
              tier.is_default ? 'border-green-500' : 'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black">{tier.name}</h3>
                  {tier.is_default && (
                    <span className="px-2 py-1 text-xs font-black rounded-full bg-green-500 text-black">
                      Default
                    </span>
                  )}
                  {!tier.is_active && (
                    <span className="px-2 py-1 text-xs font-black rounded-full bg-gray-700 text-gray-300">
                      Inactive
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-sm text-gray-400 mt-1">{tier.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-green-500">
                  {tier.commission_percentage}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Commission</div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2 mb-4">
              {tier.min_monthly_orders > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Minimum {tier.min_monthly_orders} orders/month
                </div>
              )}
              {parseFloat(tier.min_monthly_revenue) > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
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
                <div className="text-xs font-black text-gray-500 uppercase mb-2">Benefits</div>
                <div className="space-y-1">
                  {tier.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
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
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Stores on this tier:</span>
                <span className="text-sm font-black">{tier.storeCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 text-sm font-semibold bg-green-500 text-black rounded-lg hover:bg-green-600 transition">
                Edit
              </button>
              {!tier.is_default && (
                <button className="px-4 py-2 text-sm font-semibold text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 transition">
                  {tier.is_active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-black mb-2">How Commission Tiers Work</h4>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-2xl font-black mb-4">Example Commission Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { rate: 15, name: 'Default (15%)' },
            { rate: 12, name: 'Silver (12%)' },
            { rate: 10, name: 'Gold (10%)' },
          ].map(({ rate, name }: { rate: number; name: string }) => (
            <div key={rate} className="border border-gray-800 rounded-xl p-4">
              <div className="text-center mb-3">
                <div className="text-lg font-black">{name}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Subtotal:</span>
                  <span className="font-black">$50.00</span>
                </div>
                <div className="flex justify-between text-purple-500">
                  <span>Commission ({rate}%):</span>
                  <span className="font-black">-${(50 * rate / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-800 font-black">
                  <span>Store Payout:</span>
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
