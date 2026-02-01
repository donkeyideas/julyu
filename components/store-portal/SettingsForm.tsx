'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StoreOwner {
  id: string
  business_name: string
  business_type: string
  tax_id?: string
  business_license?: string
  business_address?: string
  business_phone?: string
  business_email?: string
  application_status: string
  commission_rate: number
  stripe_account_id?: string
  stripe_account_status?: string
  accepts_orders: boolean
  auto_accept_orders: boolean
}

interface Store {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  verified?: boolean
  is_active?: boolean
  latitude?: number
  longitude?: number
}

interface Props {
  initialStoreOwner: StoreOwner
  initialStore: Store | null
}

export default function SettingsForm({ initialStoreOwner, initialStore }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [storeForm, setStoreForm] = useState({
    name: initialStore?.name || '',
    address: initialStore?.address || '',
    city: initialStore?.city || '',
    state: initialStore?.state || '',
    zip: initialStore?.zip || '',
    phone: initialStore?.phone || '',
  })

  const [businessForm, setBusinessForm] = useState({
    business_name: initialStoreOwner.business_name || '',
    business_type: initialStoreOwner.business_type || '',
    business_address: initialStoreOwner.business_address || '',
    business_phone: initialStoreOwner.business_phone || '',
    business_email: initialStoreOwner.business_email || '',
    tax_id: initialStoreOwner.tax_id || '',
    business_license: initialStoreOwner.business_license || '',
  })

  const [orderPreferences, setOrderPreferences] = useState({
    accepts_orders: initialStoreOwner.accepts_orders ?? true,
    auto_accept_orders: initialStoreOwner.auto_accept_orders ?? false,
  })

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/store-portal/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(storeForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update store')
      }

      // Show detailed success message with verification status
      let successMsg = 'Store information updated successfully!'
      if (data.verified) {
        successMsg += ' ✓ Store is now verified and visible to customers.'
      }
      if (data.hasCoordinates) {
        successMsg += ' ✓ Location coordinates updated.'
      }
      setSuccess(successMsg)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/store-portal/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(businessForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update business info')
      }

      setSuccess('Business information updated successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOrderPreferences = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/store-portal/settings/order-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPreferences),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update preferences')
      }

      setSuccess('Order preferences updated successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/30">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg p-4 bg-green-500/10 border border-green-500/30">
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {/* Store Information */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
          {/* Verification Status Badge */}
          <div className="flex items-center gap-3">
            {initialStore?.verified ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Not Verified
              </span>
            )}
            {initialStore?.latitude && initialStore?.longitude ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Location Set
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                No Location
              </span>
            )}
            {initialStore?.is_active ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Inactive
              </span>
            )}
          </div>
        </div>
        {/* Help text for non-verified stores */}
        {!initialStore?.verified && initialStoreOwner.application_status === 'approved' && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-yellow-500">
              <strong>Tip:</strong> Click &quot;Save Store Info&quot; to verify your store and make it visible to customers searching for products.
            </p>
          </div>
        )}
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Store Name
            </label>
            <input
              type="text"
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Address
            </label>
            <input
              type="text"
              value={storeForm.address}
              onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                City
              </label>
              <input
                type="text"
                value={storeForm.city}
                onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                State
              </label>
              <input
                type="text"
                value={storeForm.state}
                onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                maxLength={2}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                ZIP Code
              </label>
              <input
                type="text"
                value={storeForm.zip}
                onChange={(e) => setStoreForm({ ...storeForm, zip: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Store Phone
            </label>
            <input
              type="tel"
              value={storeForm.phone}
              onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Store Info'}
            </button>
          </div>
        </form>
      </div>

      {/* Business Information */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Business Information</h2>
        <form onSubmit={handleSaveBusiness} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Name
              </label>
              <input
                type="text"
                value={businessForm.business_name}
                onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Type
              </label>
              <select
                value={businessForm.business_type}
                onChange={(e) => setBusinessForm({ ...businessForm, business_type: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="bodega">Bodega</option>
                <option value="convenience">Convenience Store</option>
                <option value="grocery">Grocery Store</option>
                <option value="market">Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Business Address
            </label>
            <input
              type="text"
              value={businessForm.business_address}
              onChange={(e) => setBusinessForm({ ...businessForm, business_address: e.target.value })}
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Phone
              </label>
              <input
                type="tel"
                value={businessForm.business_phone}
                onChange={(e) => setBusinessForm({ ...businessForm, business_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business Email
              </label>
              <input
                type="email"
                value={businessForm.business_email}
                onChange={(e) => setBusinessForm({ ...businessForm, business_email: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={businessForm.tax_id}
                onChange={(e) => setBusinessForm({ ...businessForm, tax_id: e.target.value })}
                placeholder="12-3456789"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Business License #
              </label>
              <input
                type="text"
                value={businessForm.business_license}
                onChange={(e) => setBusinessForm({ ...businessForm, business_license: e.target.value })}
                placeholder="BL-123456"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Business Info'}
            </button>
          </div>
        </form>
      </div>

      {/* Order Preferences */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Order Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Accept Orders</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                When enabled, customers can place orders at your store
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOrderPreferences({ ...orderPreferences, accepts_orders: !orderPreferences.accepts_orders })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                orderPreferences.accepts_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                orderPreferences.accepts_orders ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Auto-Accept Orders</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Automatically accept incoming orders without manual review
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOrderPreferences({ ...orderPreferences, auto_accept_orders: !orderPreferences.auto_accept_orders })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                orderPreferences.auto_accept_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                orderPreferences.auto_accept_orders ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveOrderPreferences}
              disabled={saving}
              className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission & Payouts */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Commission & Payouts</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Commission Rate</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {initialStoreOwner.commission_rate || 15}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Stripe Status</span>
              <span className={`font-semibold ${initialStoreOwner.stripe_account_id ? 'text-green-500' : 'text-yellow-500'}`}>
                {initialStoreOwner.stripe_account_id ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {!initialStoreOwner.stripe_account_id && (
              <div className="pt-2">
                <Link href="/store-portal/settings/payouts" className="text-sm text-green-500 hover:text-green-400">
                  Set up Stripe Connect to receive payouts
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* POS Integration */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>POS Integration</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Connect your Point of Sale system to automatically sync inventory.
          </p>
          <Link href="/store-portal/inventory/pos-sync" className="inline-flex items-center text-sm text-green-500 hover:text-green-400">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Configure POS Integration
          </Link>
        </div>
      </div>

      {/* Account Status */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Status</h2>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-3 ${
            initialStoreOwner.application_status === 'approved' ? 'bg-green-500' :
            initialStoreOwner.application_status === 'pending' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
            {initialStoreOwner.application_status}
          </span>
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Your store account is currently {initialStoreOwner.application_status}.
          {initialStoreOwner.application_status === 'approved' && ' You can receive and fulfill orders.'}
        </p>
      </div>

      {/* Support */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Need help?</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Contact our support team if you need assistance with your store settings.
        </p>
        <a href="mailto:info@donkeyideas.com" className="text-sm text-green-500 hover:text-green-400">
          info@donkeyideas.com
        </a>
      </div>
    </>
  )
}
