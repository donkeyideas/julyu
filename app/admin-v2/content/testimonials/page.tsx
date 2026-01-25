'use client'

import { useState } from 'react'

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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: '1',
      author_name: 'Sarah M.',
      author_title: 'Busy Parent',
      author_location: 'Cincinnati, OH',
      author_image_url: '',
      quote: 'Julyu has completely changed how I shop for groceries. I save at least $50 every week just by knowing which store has the best prices for my regular items.',
      savings_amount: 217,
      rating: 5,
      is_featured: true,
      is_active: true,
      display_order: 1,
    },
    {
      id: '2',
      author_name: 'Michael R.',
      author_title: 'Budget Conscious',
      author_location: 'Columbus, OH',
      author_image_url: '',
      quote: 'The receipt scanning feature is incredible. I just snap a photo and it tracks all my spending automatically. Now I can see exactly where my money goes.',
      savings_amount: 342,
      rating: 5,
      is_featured: true,
      is_active: true,
      display_order: 2,
    },
    {
      id: '3',
      author_name: 'Jennifer L.',
      author_title: 'Smart Shopper',
      author_location: 'Cleveland, OH',
      author_image_url: '',
      quote: 'I was skeptical at first, but the price alerts have saved me so much money. I got notified when diapers went on sale and stocked up!',
      savings_amount: 189,
      rating: 5,
      is_featured: true,
      is_active: true,
      display_order: 3,
    },
    {
      id: '4',
      author_name: 'David K.',
      author_title: 'Family of Five',
      author_location: 'Dayton, OH',
      author_image_url: '',
      quote: 'With five kids, every dollar counts. Julyu helps me find the best deals and plan my shopping trips efficiently. Game changer!',
      savings_amount: 456,
      rating: 5,
      is_featured: true,
      is_active: true,
      display_order: 4,
    },
  ])

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
        const data = await response.json()
        setTestimonials([...testimonials, { ...newTestimonial, id: data.id || String(Date.now()) } as Testimonial])
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

  const updateTestimonial = (id: string, field: keyof Testimonial, value: any) => {
    setTestimonials(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Testimonials</h1>
              <p className="text-gray-400">Manage customer testimonials displayed on the home page</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              + Add Testimonial
            </button>
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Add New Testimonial</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newTestimonial.author_name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Sarah M."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={newTestimonial.author_title}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author_title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Busy Parent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    value={newTestimonial.author_location}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author_location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Cincinnati, OH"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Savings ($)</label>
                  <input
                    type="number"
                    value={newTestimonial.savings_amount}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, savings_amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="e.g., 250"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Quote</label>
                <textarea
                  value={newTestimonial.quote}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="Their testimonial..."
                />
              </div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTestimonial.is_featured}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTestimonial.is_active}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300">Active</span>
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
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Testimonials List */}
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {editingId === testimonial.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                        <input
                          type="text"
                          value={testimonial.author_name}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_name', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                          type="text"
                          value={testimonial.author_title}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_title', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                        <input
                          type="text"
                          value={testimonial.author_location}
                          onChange={(e) => updateTestimonial(testimonial.id, 'author_location', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Savings ($)</label>
                        <input
                          type="number"
                          value={testimonial.savings_amount}
                          onChange={(e) => updateTestimonial(testimonial.id, 'savings_amount', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Quote</label>
                      <textarea
                        value={testimonial.quote}
                        onChange={(e) => updateTestimonial(testimonial.id, 'quote', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                      />
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
                        className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
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
                          <h3 className="font-semibold text-white">{testimonial.author_name}</h3>
                          <p className="text-sm text-gray-400">{testimonial.author_title} • {testimonial.author_location}</p>
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
                    <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="flex justify-between items-center">
                      <span className="text-green-500 font-semibold">Saves ${testimonial.savings_amount}/month</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(testimonial.id)}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
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
    </div>
  )
}
