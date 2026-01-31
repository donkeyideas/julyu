'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CommissionTier {
  id: string
  name: string
  description: string | null
  commission_percentage: number
  min_monthly_orders: number
  min_monthly_revenue: number
  features: string[]
  is_active: boolean
  is_default: boolean
  storeCount?: number
}

export default function CommissionTiersPage() {
  const [loading, setLoading] = useState(true)
  const [tiers, setTiers] = useState<CommissionTier[]>([])
  const [storesByTier, setStoresByTier] = useState<CommissionTier[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commission_percentage: '15',
    min_monthly_orders: '0',
    min_monthly_revenue: '0',
    features: '',
    is_default: false,
  })

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

      const tierCounts = allTiers.map((tier: CommissionTier) => ({
        ...tier,
        storeCount: storeOwners?.filter((s: any) => Math.abs(parseFloat(s.commission_rate) - tier.commission_percentage) < 0.01).length || 0
      }))

      setStoresByTier(tierCounts)
    } catch (error) {
      console.error('Error loading tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingTier(null)
    setFormData({
      name: '',
      description: '',
      commission_percentage: '15',
      min_monthly_orders: '0',
      min_monthly_revenue: '0',
      features: '',
      is_default: false,
    })
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (tier: CommissionTier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      description: tier.description || '',
      commission_percentage: tier.commission_percentage.toString(),
      min_monthly_orders: tier.min_monthly_orders.toString(),
      min_monthly_revenue: tier.min_monthly_revenue.toString(),
      features: Array.isArray(tier.features) ? tier.features.join('\n') : '',
      is_default: tier.is_default,
    })
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTier(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const payload = {
        id: editingTier?.id,
        name: formData.name,
        description: formData.description || null,
        commission_percentage: parseFloat(formData.commission_percentage),
        min_monthly_orders: parseInt(formData.min_monthly_orders) || 0,
        min_monthly_revenue: parseFloat(formData.min_monthly_revenue) || 0,
        features: featuresArray,
        is_default: formData.is_default,
      }

      const response = await fetch('/api/admin/commission-tiers', {
        method: editingTier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save tier')
      }

      closeModal()
      loadTiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const toggleTierActive = async (tier: CommissionTier) => {
    try {
      const response = await fetch('/api/admin/commission-tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tier.id,
          is_active: !tier.is_active,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update tier')
      }

      loadTiers()
    } catch (err) {
      console.error('Error toggling tier:', err)
      alert(err instanceof Error ? err.message : 'Failed to update tier')
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
  const activeTiers = allTiers.filter((t: CommissionTier) => t.is_active)

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
          onClick={openAddModal}
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
            {storesByTier.reduce((sum, t) => sum + (t.storeCount || 0), 0)}
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Default Rate</div>
          <div className="text-4xl font-black text-purple-500">
            {allTiers.find((t: CommissionTier) => t.is_default)?.commission_percentage || 15}%
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storesByTier.map((tier: CommissionTier) => (
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
              {parseFloat(String(tier.min_monthly_revenue)) > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Minimum ${parseFloat(String(tier.min_monthly_revenue)).toFixed(0)}/month revenue
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
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{tier.storeCount || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openEditModal(tier)}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-green-500 text-black rounded-lg hover:bg-green-600 transition"
              >
                Edit
              </button>
              {!tier.is_default && (
                <button
                  onClick={() => toggleTierActive(tier)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}
                >
                  {tier.is_active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {storesByTier.length === 0 && (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No commission tiers configured</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            Create First Tier
          </button>
        </div>
      )}

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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {editingTier ? 'Edit Tier' : 'Add New Tier'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:opacity-80 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Gold, Silver, Bronze"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this tier"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Commission Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Min Monthly Orders
                  </label>
                  <input
                    type="number"
                    value={formData.min_monthly_orders}
                    onChange={(e) => setFormData({ ...formData, min_monthly_orders: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Min Monthly Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      value={formData.min_monthly_revenue}
                      onChange={(e) => setFormData({ ...formData, min_monthly_revenue: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Features/Benefits (one per line)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={3}
                  placeholder="Priority support&#10;Featured placement&#10;Lower fees"
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_default" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Set as default tier for new stores
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 font-semibold rounded-lg transition"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : editingTier ? 'Update Tier' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
