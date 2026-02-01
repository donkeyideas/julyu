'use client'

import { useState, useEffect } from 'react'
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
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  operating_hours?: any
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null)
  const [store, setStore] = useState<Store | null>(null)

  // Form states
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  })

  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    tax_id: '',
    business_license: '',
  })

  const [orderPreferences, setOrderPreferences] = useState({
    accepts_orders: true,
    auto_accept_orders: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/store-portal/settings')

      if (!response.ok) {
        throw new Error('Failed to load settings')
      }

      const data = await response.json()

      if (data.storeOwner) {
        setStoreOwner(data.storeOwner)
        setBusinessForm({
          business_name: data.storeOwner.business_name || '',
          business_type: data.storeOwner.business_type || '',
          business_address: data.storeOwner.business_address || '',
          business_phone: data.storeOwner.business_phone || '',
          business_email: data.storeOwner.business_email || '',
          tax_id: data.storeOwner.tax_id || '',
          business_license: data.storeOwner.business_license || '',
        })
        setOrderPreferences({
          accepts_orders: data.storeOwner.accepts_orders ?? true,
          auto_accept_orders: data.storeOwner.auto_accept_orders ?? false,
        })
      }

      if (data.store) {
        setStore(data.store)
        setStoreForm({
          name: data.store.name || '',
          address: data.store.address || '',
          city: data.store.city || '',
          state: data.store.state || '',
          zip: data.store.zip || '',
          phone: data.store.phone || '',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/store-portal/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update store')
      }

      setSuccess('Store information updated successfully')
      fetchData()
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
        body: JSON.stringify(businessForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update business info')
      }

      setSuccess('Business information updated successfully')
      fetchData()
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
        body: JSON.stringify(orderPreferences),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update preferences')
      }

      setSuccess('Order preferences updated successfully')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your store settings and preferences
        </p>
      </div>

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
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Store Information</h2>
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
              onClick={() => {
                setOrderPreferences({ ...orderPreferences, accepts_orders: !orderPreferences.accepts_orders })
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                orderPreferences.accepts_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  orderPreferences.accepts_orders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
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
              onClick={() => {
                setOrderPreferences({ ...orderPreferences, auto_accept_orders: !orderPreferences.auto_accept_orders })
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                orderPreferences.auto_accept_orders ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  orderPreferences.auto_accept_orders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
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
                {storeOwner?.commission_rate || 15}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Stripe Status</span>
              <span className={`font-semibold ${
                storeOwner?.stripe_account_id ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {storeOwner?.stripe_account_id ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {!storeOwner?.stripe_account_id && (
              <div className="pt-2">
                <Link
                  href="/store-portal/settings/payouts"
                  className="text-sm text-green-500 hover:text-green-400"
                >
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
          <Link
            href="/store-portal/inventory/pos-sync"
            className="inline-flex items-center text-sm text-green-500 hover:text-green-400"
          >
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
            storeOwner?.application_status === 'approved' ? 'bg-green-500' :
            storeOwner?.application_status === 'pending' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
            {storeOwner?.application_status || 'Unknown'}
          </span>
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Your store account is currently {storeOwner?.application_status}.
          {storeOwner?.application_status === 'approved' && ' You can receive and fulfill orders.'}
        </p>
      </div>

      {/* Support */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Need help?</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Contact our support team if you need assistance with your store settings.
        </p>
        <a
          href="mailto:support@julyu.com"
          className="text-sm text-green-500 hover:text-green-400"
        >
          support@julyu.com
        </a>
      </div>
    </div>
  )
}
