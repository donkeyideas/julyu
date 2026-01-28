'use client'

import { useState, useEffect } from 'react'

// Helper to get auth headers for API calls (supports Firebase/Google users)
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('julyu_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.id) headers['x-user-id'] = user.id
        if (user.email) headers['x-user-email'] = user.email
        if (user.full_name) headers['x-user-name'] = user.full_name
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

interface Product {
  id: string
  name: string
  brand: string | null
  category: string | null
  image_url: string | null
}

interface Alert {
  id: string
  product_id: string | null
  target_price: number
  current_price: number | null
  is_active: boolean
  triggered_at: string | null
  created_at: string
  last_checked_at: string | null
  lowest_price_found: number | null
  notes: string | null
  products: Product | null
}

interface AlertFormData {
  product_name: string
  target_price: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [formData, setFormData] = useState<AlertFormData>({ product_name: '', target_price: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setPageError(null)
      const response = await fetch('/api/alerts', { headers: getAuthHeaders() })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setPageError('Price Alerts is a premium feature. Upgrade your plan to access it.')
        } else {
          setPageError(data.error || 'Failed to load alerts')
        }
        setAlerts([])
        return
      }

      setAlerts(data.alerts || [])
    } catch (err) {
      console.error('[Alerts] Failed to load:', err)
      setPageError('Network error loading alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/alerts/refresh', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      const data = await response.json()

      if (response.ok) {
        setAlerts(data.alerts || [])
      } else {
        setPageError(data.error || 'Failed to refresh prices')
      }
    } catch (err) {
      console.error('[Alerts] Refresh failed:', err)
      setPageError('Network error refreshing prices')
    } finally {
      setRefreshing(false)
    }
  }

  const openCreateModal = () => {
    setEditingAlert(null)
    setFormData({ product_name: '', target_price: '' })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      product_name: alert.products?.name || '',
      target_price: alert.target_price.toString(),
    })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAlert(null)
    setFormData({ product_name: '', target_price: '' })
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const targetPrice = parseFloat(formData.target_price)
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setFormError('Please enter a valid target price')
      setSaving(false)
      return
    }

    try {
      if (editingAlert) {
        const response = await fetch(`/api/alerts/${editingAlert.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ target_price: targetPrice }),
        })

        const data = await response.json()
        if (!response.ok) {
          setFormError(data.error || 'Failed to update alert')
          setSaving(false)
          return
        }

        setAlerts(prev => prev.map(a => (a.id === data.alert.id ? data.alert : a)))
      } else {
        if (!formData.product_name.trim()) {
          setFormError('Please enter a product name')
          setSaving(false)
          return
        }

        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            product_name: formData.product_name,
            target_price: targetPrice,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          setFormError(data.error || 'Failed to create alert')
          setSaving(false)
          return
        }

        setAlerts(prev => [data.alert, ...prev])
      }

      closeModal()
    } catch (err) {
      console.error('[Alerts] Submit error:', err)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm('Delete this price alert?')) return

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId))
      } else {
        const data = await response.json()
        setPageError(data.error || 'Failed to delete alert')
      }
    } catch (err) {
      console.error('[Alerts] Delete failed:', err)
      setPageError('Network error deleting alert')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4"
            style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}
          />
          <div style={{ color: 'var(--text-muted)' }}>Loading alerts...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            Price Alerts
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Get notified when prices drop to your target
          </p>
        </div>
        <div className="flex gap-3">
          {alerts.length > 0 && (
            <button
              onClick={refreshPrices}
              disabled={refreshing}
              className="px-5 py-3 rounded-lg font-semibold transition flex items-center gap-2 hover:border-green-500"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Checking...' : 'Refresh Prices'}
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            + New Alert
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {pageError && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <p style={{ color: '#ef4444' }}>{pageError}</p>
          <button onClick={() => setPageError(null)} className="text-red-400 hover:text-red-300 ml-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Alerts Grid */}
      {alerts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map(alert => {
            const isTriggered = alert.current_price !== null && alert.current_price <= alert.target_price
            const savings = alert.current_price !== null ? alert.target_price - alert.current_price : null

            return (
              <div
                key={alert.id}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: isTriggered
                    ? '1px solid rgba(34,197,94,0.4)'
                    : '1px solid var(--border-color)',
                }}
              >
                {/* Status + Delete */}
                <div className="flex justify-between items-start mb-4">
                  {isTriggered ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Price Drop!
                      {savings !== null && savings > 0 && (
                        <span className="ml-0.5">(Save ${savings.toFixed(2)})</span>
                      )}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                    >
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      Watching
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition"
                    style={{ color: 'var(--text-muted)' }}
                    title="Delete alert"
                  >
                    <svg className="w-4 h-4 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {alert.products?.name || 'Unknown Product'}
                </h3>
                {alert.products?.brand && (
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                    {alert.products.brand}
                  </p>
                )}
                {alert.products?.category && (
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    {alert.products.category}
                  </p>
                )}

                {/* Price Comparison */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      Target
                    </div>
                    <div className="text-xl font-bold text-green-500">${alert.target_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      Current
                    </div>
                    <div
                      className="text-xl font-bold"
                      style={{ color: isTriggered ? '#22c55e' : 'var(--text-primary)' }}
                    >
                      {alert.current_price !== null ? `$${alert.current_price.toFixed(2)}` : '--'}
                    </div>
                  </div>
                  {alert.lowest_price_found !== null && alert.lowest_price_found !== alert.current_price && (
                    <div>
                      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        Lowest
                      </div>
                      <div className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                        ${alert.lowest_price_found.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="text-xs space-y-1 mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                    <span>Created</span>
                    <span>{formatDate(alert.created_at)}</span>
                  </div>
                  {alert.last_checked_at && (
                    <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                      <span>Last checked</span>
                      <span>{formatDateTime(alert.last_checked_at)}</span>
                    </div>
                  )}
                  {alert.triggered_at && (
                    <div className="flex justify-between text-green-500/70">
                      <span>Price dropped</span>
                      <span>{formatDate(alert.triggered_at)}</span>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(alert)}
                  className="mt-4 w-full py-2 rounded-lg text-sm hover:border-green-500 hover:text-green-500 transition"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Edit Target Price
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        !pageError && (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <div className="mb-2 text-lg" style={{ color: 'var(--text-muted)' }}>
              No price alerts yet
            </div>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Create an alert to track prices on your favorite products!
            </p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Create Your First Alert
            </button>
          </div>
        )
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-8 max-w-md w-full"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {editingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
            </h2>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="mb-4 p-3 bg-red-500/15 text-red-500 rounded-lg text-sm">{formError}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={e => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                    disabled={!!editingAlert}
                    placeholder="e.g., Organic Milk, Bread, Eggs"
                    className="w-full rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {editingAlert && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Product cannot be changed. Create a new alert instead.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Target Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.target_price}
                      onChange={e => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full rounded-lg pl-8 pr-4 py-3 focus:border-green-500 focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    You&apos;ll be notified when the price drops to or below this amount
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-lg hover:opacity-80 transition"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
