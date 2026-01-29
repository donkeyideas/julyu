import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import CommissionTierForm from '@/components/admin/CommissionTierForm'

export const metadata = {
  title: 'Commission Tiers - Admin - Julyu',
  description: 'Manage commission tier pricing',
}

export default async function CommissionTiersPage() {
  // Verify admin access
  const { isAdmin, error } = await verifyAdminAccess()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()

  // Fetch all commission tiers
  const { data: tiers, error: fetchError } = await supabase
    .from('commission_tiers')
    .select('*')
    .order('commission_percentage', { ascending: false })

  if (fetchError) {
    console.error('Fetch tiers error:', fetchError)
  }

  const allTiers = tiers || []
  const activeTiers = allTiers.filter(t => t.is_active)

  // Get store count per tier
  const { data: storeOwners } = await supabase
    .from('store_owners')
    .select('id, commission_rate')
    .eq('application_status', 'approved')

  const storesByTier = allTiers.map(tier => ({
    ...tier,
    storeCount: storeOwners?.filter(s => Math.abs(parseFloat(s.commission_rate) - tier.commission_percentage) < 0.01).length || 0
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tiers</h1>
          <p className="text-gray-600 mt-1">
            Configure pricing tiers for store owners
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          onClick={() => {
            // This will be handled by the form component
          }}
        >
          Add New Tier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Tiers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allTiers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Active Tiers</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {activeTiers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Stores Using Tiers</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {storeOwners?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Default Rate</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {allTiers.find(t => t.is_default)?.commission_percentage || 15}%
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storesByTier.map(tier => (
          <div
            key={tier.id}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
              tier.is_default ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  {tier.is_default && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                  {!tier.is_active && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                {tier.description && (
                  <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {tier.commission_percentage}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Commission</div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2 mb-4">
              {tier.min_monthly_orders > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Minimum {tier.min_monthly_orders} orders/month
                </div>
              )}
              {parseFloat(tier.min_monthly_revenue) > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
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
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">Benefits</div>
                <div className="space-y-1">
                  {tier.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
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
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stores on this tier:</span>
                <span className="text-sm font-semibold text-gray-900">{tier.storeCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                Edit
              </button>
              {!tier.is_default && (
                <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                  {tier.is_active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How Commission Tiers Work</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Commission Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { rate: 15, name: 'Default (15%)' },
            { rate: 12, name: 'Silver (12%)' },
            { rate: 10, name: 'Gold (10%)' },
          ].map(({ rate, name }) => (
            <div key={rate} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-lg font-bold text-gray-900">{name}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Subtotal:</span>
                  <span className="font-medium">$50.00</span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>Commission ({rate}%):</span>
                  <span className="font-medium">-${(50 * rate / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                  <span>Store Payout:</span>
                  <span className="text-green-600">${(50 * (1 - rate / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Tier Form (Modal - would be implemented with state) */}
      {/* <CommissionTierForm /> */}
    </div>
  )
}
