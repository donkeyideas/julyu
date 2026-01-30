'use client'

import { useState, useEffect } from 'react'
import { FEATURE_LABELS } from '@/shared/types/subscriptions'
import type { SubscriptionPlan, PromoCode, FeatureKey } from '@/shared/types/subscriptions'

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as FeatureKey[]

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'promo'>('plans')
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Promo code form state
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState<'percentage' | 'fixed' | 'free_months'>('free_months')
  const [newValue, setNewValue] = useState('')
  const [newMaxUses, setNewMaxUses] = useState('')
  const [newValidFrom, setNewValidFrom] = useState('')
  const [newValidUntil, setNewValidUntil] = useState('')
  const [newApplicablePlans, setNewApplicablePlans] = useState<string[]>([])
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [plansRes, promoRes] = await Promise.all([
        fetch('/api/admin/subscriptions/plans'),
        fetch('/api/admin/subscriptions/promo-codes'),
      ])
      const plansData = await plansRes.json()
      const promoData = await promoRes.json()
      setPlans(plansData.plans || [])
      setPromoCodes(promoData.codes || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (plan: SubscriptionPlan, updates: Partial<SubscriptionPlan>) => {
    setSaving(plan.id)
    try {
      const response = await fetch('/api/admin/subscriptions/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, ...updates }),
      })
      const data = await response.json()
      if (data.plan) {
        setPlans(prev => prev.map(p => p.id === plan.id ? data.plan : p))
        alert('Plan updated successfully!\n\nNote: Changes may take 1-2 minutes to appear on the public pricing page due to browser caching. Users can hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to see changes immediately.')
      } else {
        alert(`Error: ${data.error || 'Failed to update'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  const handleToggleFeature = async (plan: SubscriptionPlan, feature: FeatureKey, enabled: boolean) => {
    const currentFeatures = Array.isArray(plan.features) ? [...plan.features] : []
    const updatedFeatures = enabled
      ? [...currentFeatures, feature]
      : currentFeatures.filter(f => f !== feature)

    await handleUpdatePlan(plan, { features: updatedFeatures as FeatureKey[] })
  }

  const handleCreatePromo = async () => {
    if (!newCode.trim()) {
      alert('Please enter a promo code')
      return
    }
    if (!newValue || parseFloat(newValue) <= 0) {
      alert('Please enter a valid value')
      return
    }

    setSaving('new-promo')
    try {
      const response = await fetch('/api/admin/subscriptions/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          description: newDescription.trim() || null,
          type: newType,
          value: parseFloat(newValue),
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
          valid_from: newValidFrom || null,
          valid_until: newValidUntil || null,
          applicable_plans: newApplicablePlans.length > 0 ? newApplicablePlans : [],
        }),
      })
      const data = await response.json()
      if (data.code) {
        setPromoCodes(prev => [data.code, ...prev])
        setNewCode('')
        setNewValue('')
        setNewMaxUses('')
        setNewValidFrom('')
        setNewValidUntil('')
        setNewApplicablePlans([])
        setNewDescription('')
        alert('Promo code created successfully')
      } else {
        alert(`Error: ${data.error || 'Failed to create'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(null)
    }
  }

  const handleTogglePromo = async (promo: PromoCode) => {
    try {
      const response = await fetch('/api/admin/subscriptions/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
      })
      const data = await response.json()
      if (data.code) {
        setPromoCodes(prev => prev.map(p => p.id === promo.id ? data.code : p))
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeletePromo = (promo: PromoCode) => {
    setPromoToDelete(promo)
    setDeleteModalOpen(true)
  }

  const confirmDeletePromo = async () => {
    if (!promoToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/promo-codes?id=${promoToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setPromoCodes(prev => prev.filter(p => p.id !== promoToDelete.id))
        setDeleteModalOpen(false)
        setPromoToDelete(null)
      } else {
        alert(`Error: ${data.error || 'Failed to delete'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'JULYU-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(code)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Subscriptions & Promo Codes</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage subscription plans, features, and promotional codes</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgb(59, 130, 246, 0.3)' }}>
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div className="font-semibold text-blue-400 mb-1">Live Database Sync</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Changes to plans and promo codes are saved directly to the database and will appear immediately on the <a href="/pricing" target="_blank" className="text-blue-400 hover:underline">/pricing page</a> and user settings. If you don&apos;t see changes right away, try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'plans'
              ? 'bg-green-500 text-black'
              : 'hover:opacity-80'
          }`}
          style={activeTab !== 'plans' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' } : undefined}
        >
          Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('promo')}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'promo'
              ? 'bg-green-500 text-black'
              : 'hover:opacity-80'
          }`}
          style={activeTab !== 'promo' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' } : undefined}
        >
          Promo Codes ({promoCodes.length})
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {plans.map(plan => (
            <div key={plan.id} className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Slug: {plan.slug}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    plan.is_active
                      ? 'bg-green-500/15 text-green-500'
                      : 'bg-red-500/15 text-red-500'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {plan.highlight && (
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-yellow-500/15 text-yellow-500">
                      Featured
                    </span>
                  )}
                  {!plan.is_self_serve && (
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-500">
                      Contact Sales
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-green-500">
                    ${plan.price}/{plan.billing_interval === 'year' ? 'yr' : 'mo'}
                  </span>
                  <button
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="px-4 py-2 rounded-lg hover:opacity-80 text-sm"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {expandedPlan === plan.id ? 'Collapse' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Features summary */}
              <div className="flex flex-wrap gap-2 mb-2">
                {(Array.isArray(plan.features) ? plan.features : []).map(f => (
                  <span key={f} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    {FEATURE_LABELS[f as FeatureKey] || f}
                  </span>
                ))}
              </div>

              {/* Rate limits */}
              <div className="flex gap-6 text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                <span>Calls/day: {plan.max_calls_per_day}</span>
                <span>Calls/min: {plan.max_calls_per_minute}</span>
                <span>Tokens/day: {plan.max_tokens_per_day.toLocaleString()}</span>
              </div>

              {/* Expanded edit panel */}
              {expandedPlan === plan.id && (
                <PlanEditor
                  plan={plan}
                  saving={saving === plan.id}
                  onSave={(updates) => handleUpdatePlan(plan, updates)}
                  onToggleFeature={(feature, enabled) => handleToggleFeature(plan, feature, enabled)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Promo Codes Tab */}
      {activeTab === 'promo' && (
        <div>
          {/* Create Form */}
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Create Promo Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME50"
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none font-mono"
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={generateCode}
                    className="px-3 py-2 rounded-lg hover:opacity-80 text-xs"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="free_months">Free Months</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Value ({newType === 'free_months' ? 'months' : newType === 'percentage' ? '%' : '$'})
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === 'free_months' ? '3' : newType === 'percentage' ? '50' : '10'}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Max Uses (empty = unlimited)</label>
                <input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Valid From</label>
                <input
                  type="datetime-local"
                  value={newValidFrom}
                  onChange={(e) => setNewValidFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Valid Until</label>
                <input
                  type="datetime-local"
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Welcome offer - 3 months free"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Applicable Plans (leave unchecked for all)</label>
                <div className="flex gap-4">
                  {plans.filter(p => p.is_self_serve && p.price > 0).map(plan => (
                    <label key={plan.slug} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={newApplicablePlans.includes(plan.slug)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApplicablePlans(prev => [...prev, plan.slug])
                          } else {
                            setNewApplicablePlans(prev => prev.filter(s => s !== plan.slug))
                          }
                        }}
                        className="rounded text-green-500 focus:ring-green-500"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                      {plan.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreatePromo}
              disabled={saving === 'new-promo' || !newCode.trim() || !newValue}
              className="mt-4 px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving === 'new-promo' ? 'Creating...' : 'Create Promo Code'}
            </button>
          </div>

          {/* Promo Codes Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Valid Period</th>
                  <th className="px-4 py-3">Plans</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                      No promo codes yet. Create one above.
                    </td>
                  </tr>
                )}
                {promoCodes.map(promo => (
                  <tr key={promo.id} className="hover:opacity-80 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 font-mono font-bold text-green-400">{promo.code}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {promo.type === 'free_months' ? 'Free Months' : promo.type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {promo.type === 'free_months' && `${promo.value} mo`}
                      {promo.type === 'percentage' && `${promo.value}%`}
                      {promo.type === 'fixed' && `$${promo.value}`}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {promo.current_uses}/{promo.max_uses ?? '∞'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {promo.valid_from ? new Date(promo.valid_from).toLocaleDateString() : '—'}
                      {' → '}
                      {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {Array.isArray(promo.applicable_plans) && promo.applicable_plans.length > 0
                        ? promo.applicable_plans.join(', ')
                        : 'All'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePromo(promo)}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          promo.is_active
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeletePromo(promo)}
                        className="px-3 py-1 bg-red-500/15 text-red-500 rounded text-xs font-semibold hover:bg-red-500/25"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && promoToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-8 max-w-md w-full"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Delete Promo Code
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this promo code?
              </p>
              <div className="mb-3">
                <div className="font-mono font-bold text-lg text-green-400 mb-2">
                  {promoToDelete.code}
                </div>
                {promoToDelete.description && (
                  <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {promoToDelete.description}
                  </div>
                )}
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {promoToDelete.type === 'free_months' && `${promoToDelete.value} free months`}
                  {promoToDelete.type === 'percentage' && `${promoToDelete.value}% off`}
                  {promoToDelete.type === 'fixed' && `$${promoToDelete.value} off`}
                  {' • '}
                  Used {promoToDelete.current_uses} time{promoToDelete.current_uses !== 1 ? 's' : ''}
                </div>
              </div>
              <p className="text-sm text-red-400">
                This promo code will be permanently deleted. Users who have already applied it will not be affected.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setPromoToDelete(null)
                }}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-lg transition hover:opacity-80 disabled:opacity-50"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePromo}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Inline plan editor component */
function PlanEditor({
  plan,
  saving,
  onSave,
  onToggleFeature,
}: {
  plan: SubscriptionPlan
  saving: boolean
  onSave: (updates: Partial<SubscriptionPlan>) => void
  onToggleFeature: (feature: FeatureKey, enabled: boolean) => void
}) {
  const [price, setPrice] = useState(plan.price.toString())
  const [interval, setInterval] = useState(plan.billing_interval)
  const [stripePriceId, setStripePriceId] = useState(plan.stripe_price_id || '')
  const [callsDay, setCallsDay] = useState(plan.max_calls_per_day.toString())
  const [callsMin, setCallsMin] = useState(plan.max_calls_per_minute.toString())
  const [tokensDay, setTokensDay] = useState(plan.max_tokens_per_day.toString())
  const [description, setDescription] = useState(plan.description || '')

  const planFeatures = Array.isArray(plan.features) ? plan.features : []

  return (
    <div className="mt-4 pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Billing Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as 'month' | 'year')}
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Stripe Price ID</label>
          <input
            type="text"
            value={stripePriceId}
            onChange={(e) => setStripePriceId(e.target.value)}
            placeholder="price_..."
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none font-mono" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Max Calls/Day</label>
          <input
            type="number"
            value={callsDay}
            onChange={(e) => setCallsDay(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Max Calls/Min</label>
          <input
            type="number"
            value={callsMin}
            onChange={(e) => setCallsMin(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Max Tokens/Day</label>
          <input
            type="number"
            value={tokensDay}
            onChange={(e) => setTokensDay(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm focus:border-green-500 focus:outline-none" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Feature Checkboxes */}
      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Features</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_FEATURES.map(feature => (
            <label
              key={feature}
              className="flex items-center gap-2 text-sm p-2 rounded hover:opacity-80 cursor-pointer"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            >
              <input
                type="checkbox"
                checked={planFeatures.includes(feature)}
                onChange={(e) => onToggleFeature(feature, e.target.checked)}
                className="rounded text-green-500 focus:ring-green-500"
                style={{ borderColor: 'var(--border-color)' }}
              />
              {FEATURE_LABELS[feature]}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSave({
          price: parseFloat(price),
          billing_interval: interval,
          stripe_price_id: stripePriceId || null,
          max_calls_per_day: parseInt(callsDay),
          max_calls_per_minute: parseInt(callsMin),
          max_tokens_per_day: parseInt(tokensDay),
          description: description || null,
        })}
        disabled={saving}
        className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Plan Changes'}
      </button>
    </div>
  )
}
