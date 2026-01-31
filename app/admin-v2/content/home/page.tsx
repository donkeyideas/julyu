'use client'

import { useState, useEffect } from 'react'

interface SectionEditorProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  isDirty?: boolean
}

function SectionEditor({ title, isOpen, onToggle, children, isDirty }: SectionEditorProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-green-500/5 transition"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold">{title}</span>
          {isDirty && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">
              Unsaved
            </span>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  helpText?: string
}

function InputField({ label, value, onChange, placeholder, multiline, helpText }: InputFieldProps) {
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
      {helpText && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{helpText}</p>
      )}
    </div>
  )
}

export default function HomePageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    how_it_works: false,
    features: false,
    why_julyu: false,
    testimonials: false,
    store_cta: false,
    final_cta: false
  })

  // Section content state
  const [content, setContent] = useState<Record<string, any>>({
    hero: {
      badge: 'Now in Early Access',
      headline: 'Stop Overpaying for Groceries',
      subheadline: 'Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with smart technology.',
      primary_cta: { text: 'Get Early Access', link: '/auth/signup' },
      secondary_cta: { text: 'Try Demo', link: '#demo' },
      stats: [
        { value: 'Real-Time', label: 'Price Data' },
        { value: 'Smart', label: 'Technology' },
        { value: 'Free', label: 'To Start' }
      ]
    },
    how_it_works: {
      title: 'How It Works',
      subtitle: 'Get started in three simple steps',
      steps: [
        { number: 1, title: 'Search or Scan', description: 'Find any product or scan your receipt to get started instantly.' },
        { number: 2, title: 'Compare Prices', description: 'See real-time prices from stores near you, all in one place.' },
        { number: 3, title: 'Save Money', description: 'Choose the best deals and track your savings over time.' }
      ]
    },
    features: {
      title: 'Everything You Need to Save',
      subtitle: 'Powerful tools that put you in control of your grocery spending',
      features: []
    },
    why_julyu: {
      title: 'Why Julyu?',
      subtitle: '',
      problem_stats: [],
      benefits: [],
      trust_indicators: [
        { icon: 'check', label: 'SSL Secured' },
        { icon: 'shield', label: 'Privacy Protected' },
        { icon: 'lightning', label: 'Smart Technology' }
      ]
    },
    store_cta: {
      headline: 'Own a Local Store?',
      subheadline: 'Join Julyu to reach more customers and compete with the big chains.',
      cta: { text: 'Learn More', link: '/for-stores' }
    },
    final_cta: {
      headline: 'Ready to Start Saving?',
      subheadline: 'Join thousands of smart shoppers who are already saving with Julyu.',
      primary_cta: { text: 'Get Started Free', link: '/auth/signup' },
      secondary_cta: { text: 'Learn More', link: '/features' }
    }
  })

  const [originalContent, setOriginalContent] = useState<Record<string, any>>({})
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/content/pages/home')
      if (response.ok) {
        const data = await response.json()
        if (data.content && Object.keys(data.content).length > 0) {
          setContent(prev => ({ ...prev, ...data.content }))
          setOriginalContent(data.content)
        }
      }

      // Load testimonials setting
      const settingsResponse = await fetch('/api/admin/content/settings?key=homepage_testimonials_enabled')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setTestimonialsEnabled(settingsData.value !== false)
      }
    } catch (err) {
      console.error('Failed to load content:', err)
      setError('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateSection = (sectionKey: string, updates: any) => {
    setContent(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], ...updates }
    }))
    setSuccess(false)
  }

  const saveContent = async () => {
    try {
      setSaving(true)
      setError(null)

      // Convert content to sections array
      const sections = Object.entries(content).map(([key, value], index) => ({
        section_key: key,
        section_title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        content: value,
        display_order: index + 1,
        is_visible: true
      }))

      const response = await fetch('/api/admin/content/pages/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: {
            title: 'Julyu - Stop Overpaying for Groceries',
            meta_description: content.hero?.subheadline || ''
          },
          sections
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      setOriginalContent(content)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const toggleTestimonials = async () => {
    try {
      const newValue = !testimonialsEnabled
      const response = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'homepage_testimonials_enabled',
          value: newValue
        })
      })

      if (response.ok) {
        setTestimonialsEnabled(newValue)
      }
    } catch (err) {
      console.error('Failed to toggle testimonials:', err)
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Home Page Editor</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Edit all sections of the home page in one place
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
              onClick={saveContent}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {/* Status Messages */}
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

        {/* Sections */}
        <div className="space-y-4">
          {/* Hero Section */}
          <SectionEditor
            title="Hero Section"
            isOpen={openSections.hero}
            onToggle={() => toggleSection('hero')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Badge Text"
                value={content.hero?.badge || ''}
                onChange={(value) => updateSection('hero', { badge: value })}
                placeholder="e.g., Now in Early Access"
              />
              <InputField
                label="Headline"
                value={content.hero?.headline || ''}
                onChange={(value) => updateSection('hero', { headline: value })}
                placeholder="Main headline"
              />
              <InputField
                label="Subheadline"
                value={content.hero?.subheadline || ''}
                onChange={(value) => updateSection('hero', { subheadline: value })}
                multiline
                placeholder="Description text"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Primary CTA</p>
                  <InputField
                    label="Button Text"
                    value={content.hero?.primary_cta?.text || ''}
                    onChange={(value) => updateSection('hero', {
                      primary_cta: { ...content.hero?.primary_cta, text: value }
                    })}
                  />
                  <InputField
                    label="Button Link"
                    value={content.hero?.primary_cta?.link || ''}
                    onChange={(value) => updateSection('hero', {
                      primary_cta: { ...content.hero?.primary_cta, link: value }
                    })}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Secondary CTA</p>
                  <InputField
                    label="Button Text"
                    value={content.hero?.secondary_cta?.text || ''}
                    onChange={(value) => updateSection('hero', {
                      secondary_cta: { ...content.hero?.secondary_cta, text: value }
                    })}
                  />
                  <InputField
                    label="Button Link"
                    value={content.hero?.secondary_cta?.link || ''}
                    onChange={(value) => updateSection('hero', {
                      secondary_cta: { ...content.hero?.secondary_cta, link: value }
                    })}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Stats (3 items)</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {(content.hero?.stats || []).map((stat: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <InputField
                        label="Value"
                        value={stat.value || ''}
                        onChange={(value) => {
                          const newStats = [...(content.hero?.stats || [])]
                          newStats[index] = { ...newStats[index], value }
                          updateSection('hero', { stats: newStats })
                        }}
                      />
                      <InputField
                        label="Label"
                        value={stat.label || ''}
                        onChange={(value) => {
                          const newStats = [...(content.hero?.stats || [])]
                          newStats[index] = { ...newStats[index], label: value }
                          updateSection('hero', { stats: newStats })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionEditor>

          {/* How It Works Section */}
          <SectionEditor
            title="How It Works"
            isOpen={openSections.how_it_works}
            onToggle={() => toggleSection('how_it_works')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Section Title"
                value={content.how_it_works?.title || ''}
                onChange={(value) => updateSection('how_it_works', { title: value })}
              />
              <InputField
                label="Section Subtitle"
                value={content.how_it_works?.subtitle || ''}
                onChange={(value) => updateSection('how_it_works', { subtitle: value })}
              />

              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Steps</p>
                <div className="space-y-4">
                  {(content.how_it_works?.steps || []).map((step: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-black font-bold">
                          {step.number || index + 1}
                        </span>
                        <span className="font-medium">Step {step.number || index + 1}</span>
                      </div>
                      <InputField
                        label="Title"
                        value={step.title || ''}
                        onChange={(value) => {
                          const newSteps = [...(content.how_it_works?.steps || [])]
                          newSteps[index] = { ...newSteps[index], title: value }
                          updateSection('how_it_works', { steps: newSteps })
                        }}
                      />
                      <InputField
                        label="Description"
                        value={step.description || ''}
                        onChange={(value) => {
                          const newSteps = [...(content.how_it_works?.steps || [])]
                          newSteps[index] = { ...newSteps[index], description: value }
                          updateSection('how_it_works', { steps: newSteps })
                        }}
                        multiline
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionEditor>

          {/* Feature Showcase Section */}
          <SectionEditor
            title="Feature Showcase"
            isOpen={openSections.features}
            onToggle={() => toggleSection('features')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Section Title"
                value={content.features?.title || ''}
                onChange={(value) => updateSection('features', { title: value })}
              />
              <InputField
                label="Section Subtitle"
                value={content.features?.subtitle || ''}
                onChange={(value) => updateSection('features', { subtitle: value })}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Features</p>
                  <button
                    onClick={() => {
                      const newFeatures = [...(content.features?.features || [])]
                      newFeatures.push({ icon: 'star', title: '', description: '' })
                      updateSection('features', { features: newFeatures })
                    }}
                    className="text-sm text-green-500 hover:text-green-400"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(content.features?.features || []).map((feature: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <button
                        onClick={() => {
                          const newFeatures = content.features?.features.filter((_: any, i: number) => i !== index)
                          updateSection('features', { features: newFeatures })
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <InputField
                        label="Title"
                        value={feature.title || ''}
                        onChange={(value) => {
                          const newFeatures = [...(content.features?.features || [])]
                          newFeatures[index] = { ...newFeatures[index], title: value }
                          updateSection('features', { features: newFeatures })
                        }}
                      />
                      <InputField
                        label="Description"
                        value={feature.description || ''}
                        onChange={(value) => {
                          const newFeatures = [...(content.features?.features || [])]
                          newFeatures[index] = { ...newFeatures[index], description: value }
                          updateSection('features', { features: newFeatures })
                        }}
                        multiline
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionEditor>

          {/* Why Julyu Section */}
          <SectionEditor
            title="Why Julyu"
            isOpen={openSections.why_julyu}
            onToggle={() => toggleSection('why_julyu')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Section Title"
                value={content.why_julyu?.title || ''}
                onChange={(value) => updateSection('why_julyu', { title: value })}
              />
              <InputField
                label="Section Subtitle"
                value={content.why_julyu?.subtitle || ''}
                onChange={(value) => updateSection('why_julyu', { subtitle: value })}
                multiline
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Problem Stats</p>
                  <button
                    onClick={() => {
                      const newStats = [...(content.why_julyu?.problem_stats || [])]
                      newStats.push({ stat: '', label: '' })
                      updateSection('why_julyu', { problem_stats: newStats })
                    }}
                    className="text-sm text-green-500 hover:text-green-400"
                  >
                    + Add Stat
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {(content.why_julyu?.problem_stats || []).map((stat: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <button
                        onClick={() => {
                          const newStats = content.why_julyu?.problem_stats.filter((_: any, i: number) => i !== index)
                          updateSection('why_julyu', { problem_stats: newStats })
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <InputField
                        label="Stat"
                        value={stat.stat || ''}
                        onChange={(value) => {
                          const newStats = [...(content.why_julyu?.problem_stats || [])]
                          newStats[index] = { ...newStats[index], stat: value }
                          updateSection('why_julyu', { problem_stats: newStats })
                        }}
                        placeholder="e.g., $2,000+"
                      />
                      <InputField
                        label="Label"
                        value={stat.label || ''}
                        onChange={(value) => {
                          const newStats = [...(content.why_julyu?.problem_stats || [])]
                          newStats[index] = { ...newStats[index], label: value }
                          updateSection('why_julyu', { problem_stats: newStats })
                        }}
                        placeholder="Description"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Benefits</p>
                  <button
                    onClick={() => {
                      const newBenefits = [...(content.why_julyu?.benefits || [])]
                      newBenefits.push({ icon: 'star', title: '', description: '' })
                      updateSection('why_julyu', { benefits: newBenefits })
                    }}
                    className="text-sm text-green-500 hover:text-green-400"
                  >
                    + Add Benefit
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(content.why_julyu?.benefits || []).map((benefit: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <button
                        onClick={() => {
                          const newBenefits = content.why_julyu?.benefits.filter((_: any, i: number) => i !== index)
                          updateSection('why_julyu', { benefits: newBenefits })
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <InputField
                        label="Title"
                        value={benefit.title || ''}
                        onChange={(value) => {
                          const newBenefits = [...(content.why_julyu?.benefits || [])]
                          newBenefits[index] = { ...newBenefits[index], title: value }
                          updateSection('why_julyu', { benefits: newBenefits })
                        }}
                      />
                      <InputField
                        label="Description"
                        value={benefit.description || ''}
                        onChange={(value) => {
                          const newBenefits = [...(content.why_julyu?.benefits || [])]
                          newBenefits[index] = { ...newBenefits[index], description: value }
                          updateSection('why_julyu', { benefits: newBenefits })
                        }}
                        multiline
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Trust Indicators</p>
                  <button
                    onClick={() => {
                      const newIndicators = [...(content.why_julyu?.trust_indicators || [])]
                      newIndicators.push({ icon: 'check', label: '' })
                      updateSection('why_julyu', { trust_indicators: newIndicators })
                    }}
                    className="text-sm text-green-500 hover:text-green-400"
                  >
                    + Add Indicator
                  </button>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Icons: check, shield, lightning, star
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {(content.why_julyu?.trust_indicators || []).map((indicator: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <button
                        onClick={() => {
                          const newIndicators = content.why_julyu?.trust_indicators.filter((_: any, i: number) => i !== index)
                          updateSection('why_julyu', { trust_indicators: newIndicators })
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <InputField
                        label="Icon"
                        value={indicator.icon || ''}
                        onChange={(value) => {
                          const newIndicators = [...(content.why_julyu?.trust_indicators || [])]
                          newIndicators[index] = { ...newIndicators[index], icon: value }
                          updateSection('why_julyu', { trust_indicators: newIndicators })
                        }}
                        placeholder="check, shield, lightning, star"
                      />
                      <InputField
                        label="Label"
                        value={indicator.label || ''}
                        onChange={(value) => {
                          const newIndicators = [...(content.why_julyu?.trust_indicators || [])]
                          newIndicators[index] = { ...newIndicators[index], label: value }
                          updateSection('why_julyu', { trust_indicators: newIndicators })
                        }}
                        placeholder="e.g., SSL Secured"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionEditor>

          {/* Testimonials Section */}
          <SectionEditor
            title="Testimonials"
            isOpen={openSections.testimonials}
            onToggle={() => toggleSection('testimonials')}
          >
            <div className="pt-4">
              <div className="flex items-center justify-between p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div>
                  <p className="font-medium">Display on Homepage</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Show or hide the testimonials section on the home page
                  </p>
                </div>
                <button
                  onClick={toggleTestimonials}
                  className={`w-14 h-7 rounded-full transition relative ${
                    testimonialsEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                      testimonialsEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <a
                href="/admin-v2/content/testimonials"
                className="flex items-center gap-2 text-green-500 hover:text-green-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Manage Testimonials
              </a>
            </div>
          </SectionEditor>

          {/* Store Owner CTA Section */}
          <SectionEditor
            title="Store Owner CTA"
            isOpen={openSections.store_cta}
            onToggle={() => toggleSection('store_cta')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Headline"
                value={content.store_cta?.headline || ''}
                onChange={(value) => updateSection('store_cta', { headline: value })}
              />
              <InputField
                label="Subheadline"
                value={content.store_cta?.subheadline || ''}
                onChange={(value) => updateSection('store_cta', { subheadline: value })}
                multiline
              />
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Button Text"
                  value={content.store_cta?.cta?.text || ''}
                  onChange={(value) => updateSection('store_cta', {
                    cta: { ...content.store_cta?.cta, text: value }
                  })}
                />
                <InputField
                  label="Button Link"
                  value={content.store_cta?.cta?.link || ''}
                  onChange={(value) => updateSection('store_cta', {
                    cta: { ...content.store_cta?.cta, link: value }
                  })}
                />
              </div>
            </div>
          </SectionEditor>

          {/* Final CTA Section */}
          <SectionEditor
            title="Final CTA"
            isOpen={openSections.final_cta}
            onToggle={() => toggleSection('final_cta')}
          >
            <div className="grid gap-4 pt-4">
              <InputField
                label="Headline"
                value={content.final_cta?.headline || ''}
                onChange={(value) => updateSection('final_cta', { headline: value })}
              />
              <InputField
                label="Subheadline"
                value={content.final_cta?.subheadline || ''}
                onChange={(value) => updateSection('final_cta', { subheadline: value })}
                multiline
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Primary CTA</p>
                  <InputField
                    label="Button Text"
                    value={content.final_cta?.primary_cta?.text || ''}
                    onChange={(value) => updateSection('final_cta', {
                      primary_cta: { ...content.final_cta?.primary_cta, text: value }
                    })}
                  />
                  <InputField
                    label="Button Link"
                    value={content.final_cta?.primary_cta?.link || ''}
                    onChange={(value) => updateSection('final_cta', {
                      primary_cta: { ...content.final_cta?.primary_cta, link: value }
                    })}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Secondary CTA</p>
                  <InputField
                    label="Button Text"
                    value={content.final_cta?.secondary_cta?.text || ''}
                    onChange={(value) => updateSection('final_cta', {
                      secondary_cta: { ...content.final_cta?.secondary_cta, text: value }
                    })}
                  />
                  <InputField
                    label="Button Link"
                    value={content.final_cta?.secondary_cta?.link || ''}
                    onChange={(value) => updateSection('final_cta', {
                      secondary_cta: { ...content.final_cta?.secondary_cta, link: value }
                    })}
                  />
                </div>
              </div>
            </div>
          </SectionEditor>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={saveContent}
            disabled={saving}
            className="px-8 py-4 bg-green-500 text-black font-bold rounded-xl shadow-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
