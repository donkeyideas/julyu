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
  products: Product | null
}

interface AlertFormData {
  product_name: string
  target_price: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [formData, setFormData] = useState<AlertFormData>({ product_name: '', target_price: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', { headers: getAuthHeaders() })
      const data = await response.json()

      // Load any locally stored alerts
      let localAlerts: Alert[] = []
      const storedAlerts = localStorage.getItem('priceAlerts')
      if (storedAlerts) {
        try {
          localAlerts = JSON.parse(storedAlerts)
        } catch (e) {
          console.error('Failed to parse stored alerts:', e)
        }
      }

      // Merge API alerts with local alerts (avoid duplicates)
      const apiAlerts = (data.alerts || []).filter((a: Alert) => a.is_active)
      const apiAlertIds = new Set(apiAlerts.map((a: Alert) => a.id))
      const uniqueLocalAlerts = localAlerts.filter(la => !apiAlertIds.has(la.id) && la.is_active)

      setAlerts([...apiAlerts, ...uniqueLocalAlerts])
    } catch (error) {
      console.error('Failed to load alerts:', error)
      // Load from localStorage on error
      const storedAlerts = localStorage.getItem('priceAlerts')
      if (storedAlerts) {
        try {
          setAlerts(JSON.parse(storedAlerts).filter((a: Alert) => a.is_active))
        } catch (e) {
          console.error('Failed to parse stored alerts:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingAlert(null)
    setFormData({ product_name: '', target_price: '' })
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      product_name: alert.products?.name || '',
      target_price: alert.target_price.toString()
    })
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAlert(null)
    setFormData({ product_name: '', target_price: '' })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const targetPrice = parseFloat(formData.target_price)
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setError('Please enter a valid target price')
      setSaving(false)
      return
    }

    try {
      if (editingAlert) {
        // Update existing alert
        const response = await fetch(`/api/alerts/${editingAlert.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ target_price: targetPrice })
        })

        const data = await response.json()
        const updatedAlert = data.alert

        setAlerts(prev => {
          const updated = prev.map(a => a.id === updatedAlert.id ? updatedAlert : a)
          // Save to localStorage
          localStorage.setItem('priceAlerts', JSON.stringify(updated))
          return updated
        })
      } else {
        // Create new alert
        if (!formData.product_name.trim()) {
          setError('Please enter a product name')
          setSaving(false)
          return
        }

        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            product_name: formData.product_name,
            target_price: targetPrice
          })
        })

        const data = await response.json()
        const newAlert = data.alert

        setAlerts(prev => {
          const updated = [newAlert, ...prev]
          // Save to localStorage for persistence
          localStorage.setItem('priceAlerts', JSON.stringify(updated))
          return updated
        })
      }

      closeModal()
    } catch (err) {
      console.error('Alert error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      setAlerts(prev => {
        const updated = prev.filter(a => a.id !== alertId)
        // Update localStorage
        localStorage.setItem('priceAlerts', JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.error('Failed to delete alert:', error)
      // Still remove from UI even if API fails
      setAlerts(prev => {
        const updated = prev.filter(a => a.id !== alertId)
        localStorage.setItem('priceAlerts', JSON.stringify(updated))
        return updated
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading alerts...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Price Alerts</h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Get notified when prices drop to your target</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          + New Alert
        </button>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Product</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Target Price</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Current Price</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
              <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const isTriggered = alert.current_price !== null && alert.current_price <= alert.target_price
                const savings = alert.current_price ? (alert.current_price - alert.target_price) : null

                return (
                  <tr key={alert.id} className="hover:opacity-80" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="p-4">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{alert.products?.name || 'Unknown Product'}</div>
                      {alert.products?.brand && (
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{alert.products.brand}</div>
                      )}
                    </td>
                    <td className="p-4 text-green-500 font-bold">
                      ${alert.target_price.toFixed(2)}
                    </td>
                    <td className="p-4 font-bold" style={{ color: isTriggered ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {alert.current_price !== null ? `$${alert.current_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4">
                      {isTriggered ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                          <span>&#10003;</span> Price Drop!
                          {savings !== null && savings < 0 && (
                            <span className="ml-1">(Save ${Math.abs(savings).toFixed(2)})</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                          Watching
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {isTriggered ? (
                          <button className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition">
                            Shop Now
                          </button>
                        ) : (
                          <button
                            onClick={() => openEditModal(alert)}
                            className="px-4 py-2 rounded-lg hover:border-green-500 hover:text-green-500 transition"
                            style={{ border: '1px solid var(--border-color)' }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="px-4 py-2 rounded-lg hover:border-red-500 hover:text-red-500 transition"
                          style={{ border: '1px solid var(--border-color)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="mb-4" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    No price alerts yet
                  </div>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Create an alert to be notified when prices drop!</p>
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                  >
                    Create Your First Alert
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-8 max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {editingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
            </h2>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-500/15 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Product Name</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                    disabled={!!editingAlert}
                    placeholder="e.g., Organic Milk, Bread, Eggs"
                    className="w-full rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none disabled:opacity-50"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  {editingAlert && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Product cannot be changed. Create a new alert instead.</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Target Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.target_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full rounded-lg pl-8 pr-4 py-3 focus:border-green-500 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>You&apos;ll be notified when the price drops to or below this amount</p>
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
                  {saving ? 'Saving...' : (editingAlert ? 'Update Alert' : 'Create Alert')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
