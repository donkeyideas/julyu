'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  author_name: string
  author_title: string
  author_location: string
  author_image_url: string
  quote: string
  savings_amount: number
  rating: number
  is_featured: boolean
  is_active: boolean
  display_order: number
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionEnabled, setSectionEnabled] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    author_name: '',
    author_title: '',
    author_location: '',
    quote: '',
    savings_amount: 0,
    rating: 5,
    is_featured: false,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load testimonials and settings on mount
  useEffect(() => {
    loadTestimonials()
    loadSettings()
  }, [])

  const loadTestimonials = async () => {
    try {
      const response = await fetch('/api/admin/content/testimonials')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.testimonials || [])
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/content/settings?key=homepage_testimonials_enabled')
      if (response.ok) {
        const data = await response.json()
        if (data.setting?.value !== undefined) {
          setSectionEnabled(data.setting.value === true || data.setting.value === 'true')
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const toggleSectionEnabled = async () => {
    setSavingSettings(true)
    const newValue = !sectionEnabled
    try {
      const response = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'homepage_testimonials_enabled',
          value: newValue,
          description: 'Whether to show testimonials section on the homepage',
        }),
      })

      if (response.ok) {
        setSectionEnabled(newValue)
        setMessage({ type: 'success', text: `Testimonials section ${newValue ? 'enabled' : 'disabled'} on homepage` })
      } else {
        setMessage({ type: 'error', text: 'Failed to update setting' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setting' })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSave = async (testimonial: Testimonial) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/content/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonial),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Testimonial saved successfully!' })
        setEditingId(null)
        loadTestimonials()
      } else {
        setMessage({ type: 'error', text: 'Failed to save testimonial' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save testimonial' })
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/content/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTestimonial,
          display_order: testimonials.length + 1,
        }),
      })

      if (response.ok) {
        setNewTestimonial({
          author_name: '',
          author_title: '',
          author_location: '',
          quote: '',
          savings_amount: 0,
          rating: 5,
          is_featured: false,
          is_active: true,
        })
        setShowAddForm(false)
        setMessage({ type: 'success', text: 'Testimonial added successfully!' })
        loadTestimonials()
      } else {
        setMessage({ type: 'error', text: 'Failed to add testimonial' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add testimonial' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const response = await fetch(`/api/admin/content/testimonials?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTestimonials(testimonials.filter(t => t.id !== id))
        setMessage({ type: 'success', text: 'Testimonial deleted successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to delete testimonial' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete testimonial' })
    }
  }

  const updateTestimonial = (id: string, field: keyof Testimonial, value: unknown) => {
    setTestimonials(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading testimonials...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Testimonials</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage customer testimonials displayed on the home page</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          + Add Testimonial
        </button>
      </div>

      {/* Section Toggle */}
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Display on Homepage</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {sectionEnabled
                ? 'Testimonials section is visible on the homepage'
                : 'Testimonials section is hidden from the homepage'}
            </p>
          </div>
          <button
            onClick={toggleSectionEnabled}
            disabled={savingSettings}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              sectionEnabled ? 'bg-green-500' : 'bg-gray-600'
            } ${savingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                sectionEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add New Testimonial</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Name</label>
              <input
                type="text"
                value={newTestimonial.author_name}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, author_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g., Sarah M."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Title</label>
              <input
                type="text"
                value={newTestimonial.author_title}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, author_title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g., Busy Parent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Location</label>
              <input
                type="text"
                value={newTestimonial.author_location}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, author_location: e.target.value })}
                className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g., Cincinnati, OH"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Monthly Savings ($)</label>
              <input
                type="number"
                value={newTestimonial.savings_amount}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, savings_amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="e.g., 250"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quote</label>
            <textarea
              value={newTestimonial.quote}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Their testimonial..."
            />
          </div>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTestimonial.is_featured}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, is_featured: e.target.checked })}
                className="w-5 h-5 rounded text-green-500 focus:ring-green-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTestimonial.is_active}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, is_active: e.target.checked })}
                className="w-5 h-5 rounded text-green-500 focus:ring-green-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Active</span>
            </label>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Testimonial'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 rounded-lg transition"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No testimonials yet</h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Add your first testimonial to display on the homepage</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
          >
            + Add Testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              {editingId === testimonial.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Name</label>
                      <input
                        type="text"
                        value={testimonial.author_name}
                        onChange={(e) => updateTestimonial(testimonial.id, 'author_name', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Title</label>
                      <input
                        type="text"
                        value={testimonial.author_title}
                        onChange={(e) => updateTestimonial(testimonial.id, 'author_title', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Location</label>
                      <input
                        type="text"
                        value={testimonial.author_location}
                        onChange={(e) => updateTestimonial(testimonial.id, 'author_location', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Monthly Savings ($)</label>
                      <input
                        type="number"
                        value={testimonial.savings_amount}
                        onChange={(e) => updateTestimonial(testimonial.id, 'savings_amount', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quote</label>
                    <textarea
                      value={testimonial.quote}
                      onChange={(e) => updateTestimonial(testimonial.id, 'quote', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testimonial.is_featured}
                        onChange={(e) => updateTestimonial(testimonial.id, 'is_featured', e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testimonial.is_active}
                        onChange={(e) => updateTestimonial(testimonial.id, 'is_active', e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>Active</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleSave(testimonial)}
                      disabled={saving}
                      className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-6 py-3 rounded-lg transition"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold">
                        {testimonial.author_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{testimonial.author_name}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{testimonial.author_title} • {testimonial.author_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testimonial.is_featured && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Featured</span>
                      )}
                      {testimonial.is_active ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>
                  <p className="mb-4 italic" style={{ color: 'var(--text-secondary)' }}>&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-semibold">Saves ${testimonial.savings_amount}/month</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(testimonial.id)}
                        className="px-4 py-2 rounded-lg transition"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
