'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Store {
  id: string
  name: string
  logo_url: string
  website_url?: string
  display_order: number
  is_active: boolean
  parent_network?: string
}

export default function StoreTickerEditor() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    parent_network: '',
    is_active: true
  })

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stores/ticker')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      } else {
        setError('Failed to load stores')
      }
    } catch (err) {
      setError('Failed to load stores')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.logo_url) {
      setError('Name and logo URL are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/admin/stores/ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          display_order: stores.length + 1
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        setShowAddForm(false)
        setFormData({ name: '', logo_url: '', website_url: '', parent_network: '', is_active: true })
        loadStores()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add store')
      }
    } catch (err) {
      setError('Failed to add store')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingStore) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/admin/stores/ticker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStore.id,
          ...formData,
          display_order: editingStore.display_order
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        setEditingStore(null)
        setFormData({ name: '', logo_url: '', website_url: '', parent_network: '', is_active: true })
        loadStores()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update store')
      }
    } catch (err) {
      setError('Failed to update store')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return

    try {
      const response = await fetch(`/api/admin/stores/ticker?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadStores()
      } else {
        setError('Failed to delete store')
      }
    } catch (err) {
      setError('Failed to delete store')
    }
  }

  const handleToggleActive = async (store: Store) => {
    try {
      const response = await fetch('/api/admin/stores/ticker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...store,
          is_active: !store.is_active
        })
      })

      if (response.ok) {
        loadStores()
      }
    } catch (err) {
      setError('Failed to toggle store')
    }
  }

  const startEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      logo_url: store.logo_url,
      website_url: store.website_url || '',
      parent_network: store.parent_network || '',
      is_active: store.is_active
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingStore(null)
    setShowAddForm(false)
    setFormData({ name: '', logo_url: '', website_url: '', parent_network: '', is_active: true })
  }

  const moveStore = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= stores.length) return

    const newStores = [...stores]
    const [removed] = newStores.splice(index, 1)
    newStores.splice(newIndex, 0, removed)

    // Update display_order for affected stores
    const updates = newStores.map((store, i) => ({
      ...store,
      display_order: i + 1
    }))

    setStores(updates)

    // Save order to backend
    for (const store of updates) {
      await fetch('/api/admin/stores/ticker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store)
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">Store Ticker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage the scrolling store logos on the homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            Preview
          </a>
          <button
            onClick={() => { setShowAddForm(true); setEditingStore(null); }}
            className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            + Add Store
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          Changes saved successfully!
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingStore) && (
        <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-xl font-bold mb-4">
            {editingStore ? 'Edit Store' : 'Add New Store'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Store Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kroger"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Logo URL *
              </label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="/images/stores/kroger.png"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Website URL (optional)
              </label>
              <input
                type="text"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://www.kroger.com"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Parent Network (optional)
              </label>
              <input
                type="text"
                value={formData.parent_network}
                onChange={(e) => setFormData({ ...formData, parent_network: e.target.value })}
                placeholder="e.g., Instacart"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                For stores powered by an aggregator like Instacart
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 accent-green-500"
            />
            <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Active (visible on homepage)
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={editingStore ? handleUpdate : handleAdd}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : (editingStore ? 'Update Store' : 'Add Store')}
            </button>
            <button
              onClick={cancelEdit}
              className="px-6 py-2 rounded-lg transition"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="mb-8 p-6 rounded-xl overflow-hidden" style={{ backgroundColor: '#000', border: '1px solid var(--border-color)' }}>
        <p className="text-center text-gray-500 text-sm mb-4 uppercase tracking-wider">
          Preview
        </p>
        <div className="flex gap-8 justify-center flex-wrap">
          {stores.filter(s => s.is_active).map(store => (
            <div key={store.id} className="grayscale opacity-50">
              {store.logo_url.startsWith('/') || store.logo_url.startsWith('http') ? (
                <Image
                  src={store.logo_url}
                  alt={store.name}
                  width={100}
                  height={40}
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="h-10 px-4 flex items-center justify-center bg-gray-800 rounded text-gray-400 text-sm">
                  {store.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Store List */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold">All Stores ({stores.length})</h2>
        </div>
        {stores.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            No stores added yet. Click &quot;Add Store&quot; to get started.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {stores.map((store, index) => (
              <div
                key={store.id}
                className="p-4 flex items-center gap-4 hover:bg-black/20 transition"
              >
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStore(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStore(index, 'down')}
                    disabled={index === stores.length - 1}
                    className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Logo preview */}
                <div className="w-24 h-12 flex items-center justify-center bg-black rounded">
                  {store.logo_url.startsWith('/') || store.logo_url.startsWith('http') ? (
                    <Image
                      src={store.logo_url}
                      alt={store.name}
                      width={80}
                      height={32}
                      className="h-8 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500">No image</span>
                  )}
                </div>

                {/* Store info */}
                <div className="flex-1">
                  <div className="font-medium">{store.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {store.logo_url}
                  </div>
                  {store.parent_network && (
                    <div className="text-xs text-green-500 mt-1">
                      Network: {store.parent_network}
                    </div>
                  )}
                </div>

                {/* Status */}
                <button
                  onClick={() => handleToggleActive(store)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    store.is_active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {store.is_active ? 'Active' : 'Inactive'}
                </button>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(store)}
                    className="p-2 rounded hover:bg-gray-700 transition"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-2 rounded hover:bg-red-500/20 text-red-400 transition"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <h3 className="font-medium mb-2">Tips</h3>
        <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>• Upload store logos to <code className="bg-black/30 px-1 rounded">/public/images/stores/</code></li>
          <li>• Use white or light-colored logos for best results on dark background</li>
          <li>• PNG format with transparent background works best</li>
          <li>• Recommended size: 200x80 pixels</li>
          <li>• Use the Parent Network field to group stores under aggregators (e.g., Instacart)</li>
        </ul>
      </div>
    </div>
  )
}
