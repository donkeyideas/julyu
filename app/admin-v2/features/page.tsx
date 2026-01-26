'use client'

import { useState, useEffect } from 'react'

interface FeatureFlag {
  id: string
  name: string
  description: string | null
  is_enabled: boolean
  rollout_percentage: number
  created_at: string
  updated_at: string
}

export default function FeatureFlagsPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_enabled: false,
    rollout_percentage: 0
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    try {
      const response = await fetch('/api/admin/features')
      if (response.ok) {
        const data = await response.json()
        setFeatures(data.features || [])
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingFeature(null)
    setFormData({ name: '', description: '', is_enabled: false, rollout_percentage: 0 })
    setShowModal(true)
  }

  const openEditModal = (feature: FeatureFlag) => {
    setEditingFeature(feature)
    setFormData({
      name: feature.name,
      description: feature.description || '',
      is_enabled: feature.is_enabled,
      rollout_percentage: feature.rollout_percentage
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingFeature) {
        const response = await fetch('/api/admin/features', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFeature.id, ...formData })
        })

        if (response.ok) {
          const { feature } = await response.json()
          setFeatures(prev => prev.map(f => f.id === feature.id ? feature : f))
        }
      } else {
        const response = await fetch('/api/admin/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const { feature } = await response.json()
          setFeatures(prev => [...prev, feature])
        }
      }

      setShowModal(false)
    } catch (error) {
      console.error('Failed to save feature flag:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = async (feature: FeatureFlag) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feature.id, is_enabled: !feature.is_enabled })
      })

      if (response.ok) {
        const { feature: updated } = await response.json()
        setFeatures(prev => prev.map(f => f.id === updated.id ? updated : f))
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error)
    }
  }

  const deleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return

    try {
      const response = await fetch(`/api/admin/features?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFeatures(prev => prev.filter(f => f.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete feature:', error)
    }
  }

  const enabledCount = features.filter(f => f.is_enabled).length

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Feature Flags</h1>
          <p className="text-gray-500 mt-2">Control feature rollout and A/B testing</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          + New Feature Flag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Total Flags</div>
          <div className="text-3xl font-bold">{features.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Enabled</div>
          <div className="text-3xl font-bold text-green-500">{enabledCount}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-500">Disabled</div>
          <div className="text-3xl font-bold text-gray-500">{features.length - enabledCount}</div>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
            Loading feature flags...
          </div>
        ) : features.length > 0 ? (
          features.map(feature => (
            <div
              key={feature.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{feature.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      feature.is_enabled
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {feature.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {feature.rollout_percentage > 0 && feature.rollout_percentage < 100 && (
                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 rounded text-xs font-medium">
                        {feature.rollout_percentage}% Rollout
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    {feature.description || 'No description'}
                  </p>

                  {/* Rollout Progress Bar */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="text-xs text-gray-500 mb-1">Rollout Percentage</div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${feature.is_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                          style={{ width: `${feature.rollout_percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{feature.rollout_percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-6">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleFeature(feature)}
                    className="relative"
                  >
                    <div className={`w-14 h-8 rounded-full transition ${
                      feature.is_enabled ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow ${
                        feature.is_enabled ? 'left-7' : 'left-1'
                      }`} />
                    </div>
                  </button>

                  <button
                    onClick={() => openEditModal(feature)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500 hover:text-green-500 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteFeature(feature.id)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:border-red-500 hover:text-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              No feature flags configured
            </div>
            <p className="text-gray-600 mb-6">Create feature flags to control feature rollout</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Create Your First Flag
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingFeature ? 'Edit Feature Flag' : 'Create Feature Flag'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Flag Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ai_assistant"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use snake_case (e.g., new_feature_v2)</p>
                </div>

                <div>
                  <label className="block font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this feature flag control?"
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Rollout Percentage</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.rollout_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{formData.rollout_percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Percentage of users who will see this feature</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <label className="font-medium">Enable Feature</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                    className="relative"
                  >
                    <div className={`w-14 h-8 rounded-full transition ${
                      formData.is_enabled ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow ${
                        formData.is_enabled ? 'left-7' : 'left-1'
                      }`} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-700 rounded-lg hover:border-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingFeature ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
