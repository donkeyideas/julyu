'use client'

import { useState, useEffect } from 'react'

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
}

function InputField({ label, value, onChange, placeholder, multiline }: InputFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      )}
    </div>
  )
}

export default function FeaturesPageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [content, setContent] = useState({
    hero: {
      headline: 'Everything You Need to Save',
      subheadline: 'Powerful tools that put you in control of your grocery spending'
    },
    features: {
      features: [
        { icon: 'chart', title: 'Real-Time Price Comparison', description: 'Compare prices across 50+ retailers including Kroger, Walmart, Target, Costco, and local stores.', details: ['Live price updates', '50+ retailers', 'Local store coverage', 'Price history charts'] },
        { icon: 'camera', title: 'AI Receipt Scanning', description: 'Our advanced AI reads your receipts in seconds. Just snap a photo and watch as every item is automatically extracted.', details: ['99% accuracy', 'Any store receipt', 'Auto-categorization', 'Instant processing'] },
        { icon: 'bell', title: 'Smart Price Alerts', description: 'Never miss a deal. Get notified instantly when items on your list drop in price at any store in your area.', details: ['Custom price targets', 'Multi-store tracking', 'Push notifications', 'Weekly deal digests'] },
        { icon: 'trending', title: 'Spending Insights', description: 'Beautiful charts and actionable insights help you understand your grocery habits.', details: ['Monthly reports', 'Category breakdown', 'Store comparison', 'Savings tracking'] },
        { icon: 'list', title: 'Smart Shopping Lists', description: 'Create lists that automatically show you the best store to shop at for maximum savings.', details: ['Multi-store optimization', 'Shareable lists', 'Recurring items', 'Budget tracking'] },
        { icon: 'map', title: 'Store Finder', description: 'Find the stores near you with the best prices for your shopping list.', details: ['GPS integration', 'Store hours', 'Trip planning', 'Gas savings calculator'] }
      ]
    },
    cta: {
      headline: 'Ready to Start Saving?',
      subheadline: 'Join thousands of smart shoppers already using Julyu.',
      cta: { text: 'Get Started Free', link: '/auth/signup' }
    }
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/content/pages/features')
      if (response.ok) {
        const data = await response.json()
        if (data.content && Object.keys(data.content).length > 0) {
          setContent(prev => ({ ...prev, ...data.content }))
        }
      }
    } catch (err) {
      console.error('Failed to load content:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async () => {
    try {
      setSaving(true)
      setError(null)

      const sections = Object.entries(content).map(([key, value], index) => ({
        section_key: key,
        section_title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        content: value,
        display_order: index + 1,
        is_visible: true
      }))

      const response = await fetch('/api/admin/content/pages/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: {
            title: 'Features - Julyu',
            meta_description: content.hero?.subheadline || ''
          },
          sections
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Features Page Editor</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Edit the /features page content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/features"
              target="_blank"
              className="px-4 py-2 rounded-lg transition"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              Preview
            </a>
            <button
              onClick={saveContent}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Hero Section</h2>
            <InputField
              label="Headline"
              value={content.hero?.headline || ''}
              onChange={(value) => setContent(prev => ({ ...prev, hero: { ...prev.hero, headline: value } }))}
            />
            <InputField
              label="Subheadline"
              value={content.hero?.subheadline || ''}
              onChange={(value) => setContent(prev => ({ ...prev, hero: { ...prev.hero, subheadline: value } }))}
              multiline
            />
          </div>

          {/* Features Section */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Features</h2>
              <button
                onClick={() => {
                  const newFeatures = [...(content.features?.features || [])]
                  newFeatures.push({ icon: 'star', title: '', description: '', details: [] })
                  setContent(prev => ({ ...prev, features: { ...prev.features, features: newFeatures } }))
                }}
                className="text-sm text-green-500 hover:text-green-400"
              >
                + Add Feature
              </button>
            </div>
            <div className="space-y-4">
              {(content.features?.features || []).map((feature: any, index: number) => (
                <div key={index} className="p-4 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    onClick={() => {
                      const newFeatures = content.features?.features.filter((_: any, i: number) => i !== index)
                      setContent(prev => ({ ...prev, features: { ...prev.features, features: newFeatures } }))
                    }}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <InputField
                    label="Title"
                    value={feature.title || ''}
                    onChange={(value) => {
                      const newFeatures = [...(content.features?.features || [])]
                      newFeatures[index] = { ...newFeatures[index], title: value }
                      setContent(prev => ({ ...prev, features: { ...prev.features, features: newFeatures } }))
                    }}
                  />
                  <InputField
                    label="Description"
                    value={feature.description || ''}
                    onChange={(value) => {
                      const newFeatures = [...(content.features?.features || [])]
                      newFeatures[index] = { ...newFeatures[index], description: value }
                      setContent(prev => ({ ...prev, features: { ...prev.features, features: newFeatures } }))
                    }}
                    multiline
                  />
                  <InputField
                    label="Details (comma-separated)"
                    value={(feature.details || []).join(', ')}
                    onChange={(value) => {
                      const newFeatures = [...(content.features?.features || [])]
                      newFeatures[index] = { ...newFeatures[index], details: value.split(',').map((d: string) => d.trim()).filter(Boolean) }
                      setContent(prev => ({ ...prev, features: { ...prev.features, features: newFeatures } }))
                    }}
                    placeholder="e.g., Live updates, 50+ retailers, Local coverage"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">CTA Section</h2>
            <InputField
              label="Headline"
              value={content.cta?.headline || ''}
              onChange={(value) => setContent(prev => ({ ...prev, cta: { ...prev.cta, headline: value } }))}
            />
            <InputField
              label="Subheadline"
              value={content.cta?.subheadline || ''}
              onChange={(value) => setContent(prev => ({ ...prev, cta: { ...prev.cta, subheadline: value } }))}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Button Text"
                value={content.cta?.cta?.text || ''}
                onChange={(value) => setContent(prev => ({ ...prev, cta: { ...prev.cta, cta: { ...prev.cta?.cta, text: value } } }))}
              />
              <InputField
                label="Button Link"
                value={content.cta?.cta?.link || ''}
                onChange={(value) => setContent(prev => ({ ...prev, cta: { ...prev.cta, cta: { ...prev.cta?.cta, link: value } } }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
