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

export default function ForStoresPageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [content, setContent] = useState({
    hero: {
      headline: 'Bring Your Local Store Online',
      subheadline: 'Connect with nearby shoppers and compete with the big chains. Join the Julyu network and grow your business.',
      cta: { text: 'Apply Now', link: '/for-stores/apply' }
    },
    how_it_works: {
      title: 'How It Works',
      steps: [
        { number: 1, title: 'Apply to Join', description: 'Fill out a quick application to get started. We\'ll review and get back to you within 48 hours.' },
        { number: 2, title: 'Upload Your Products', description: 'Add your inventory through our easy dashboard. Import from spreadsheet or add manually.' },
        { number: 3, title: 'Reach Customers', description: 'Shoppers in your area will see your prices and find your store on Julyu.' }
      ]
    },
    benefits: {
      title: 'Why Join Julyu?',
      benefits: [
        { icon: 'users', title: 'Reach Local Shoppers', description: 'Get discovered by customers in your neighborhood actively looking for groceries.' },
        { icon: 'trending', title: 'Compete on Price', description: 'Show shoppers your competitive prices compared to big chains.' },
        { icon: 'chart', title: 'Analytics Dashboard', description: 'Track views, clicks, and foot traffic from Julyu customers.' },
        { icon: 'dollar', title: 'Affordable Pricing', description: 'Simple, transparent pricing that works for stores of all sizes.' }
      ]
    },
    pricing: {
      title: 'Simple Pricing',
      subtitle: 'Choose the plan that works for your store',
      plans: [
        { name: 'Starter', price: 'Free', description: 'Get started at no cost', features: ['List up to 100 products', 'Basic analytics', 'Email support'], cta: 'Get Started' },
        { name: 'Growth', price: '$49/mo', description: 'For growing stores', features: ['Unlimited products', 'Advanced analytics', 'Priority support', 'Featured placement'], cta: 'Start Trial', popular: true },
        { name: 'Enterprise', price: 'Custom', description: 'For chains and large stores', features: ['Multi-location support', 'API access', 'Dedicated account manager', 'Custom integrations'], cta: 'Contact Us' }
      ]
    },
    faq: {
      title: 'Frequently Asked Questions',
      questions: [
        { question: 'How long does it take to get set up?', answer: 'Most stores are live within 24-48 hours of submitting their application.' },
        { question: 'What if I have multiple locations?', answer: 'Our Growth and Enterprise plans support multiple locations. Contact us for details.' },
        { question: 'How do customers find my store?', answer: 'When shoppers search for products in your area, your store and prices will appear in their results.' },
        { question: 'Can I update my prices in real-time?', answer: 'Yes! Our dashboard lets you update prices anytime, or you can use our API for automatic updates.' }
      ]
    },
    cta: {
      headline: 'Ready to Grow Your Business?',
      subheadline: 'Join hundreds of local stores already on Julyu.',
      cta: { text: 'Apply Now', link: '/for-stores/apply' }
    }
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/content/pages/for-stores')
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

      const response = await fetch('/api/admin/content/pages/for-stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: {
            title: 'For Store Owners - Julyu',
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
            <h1 className="text-3xl font-black mb-2">For Stores Page Editor</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Edit the /for-stores page content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/for-stores"
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
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="CTA Button Text"
                value={content.hero?.cta?.text || ''}
                onChange={(value) => setContent(prev => ({ ...prev, hero: { ...prev.hero, cta: { ...prev.hero?.cta, text: value } } }))}
              />
              <InputField
                label="CTA Button Link"
                value={content.hero?.cta?.link || ''}
                onChange={(value) => setContent(prev => ({ ...prev, hero: { ...prev.hero, cta: { ...prev.hero?.cta, link: value } } }))}
              />
            </div>
          </div>

          {/* How It Works */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">How It Works</h2>
            <InputField
              label="Section Title"
              value={content.how_it_works?.title || ''}
              onChange={(value) => setContent(prev => ({ ...prev, how_it_works: { ...prev.how_it_works, title: value } }))}
            />
            <div className="space-y-4 mt-4">
              {(content.how_it_works?.steps || []).map((step: any, index: number) => (
                <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-black font-bold">
                      {step.number || index + 1}
                    </span>
                  </div>
                  <InputField
                    label="Title"
                    value={step.title || ''}
                    onChange={(value) => {
                      const newSteps = [...(content.how_it_works?.steps || [])]
                      newSteps[index] = { ...newSteps[index], title: value }
                      setContent(prev => ({ ...prev, how_it_works: { ...prev.how_it_works, steps: newSteps } }))
                    }}
                  />
                  <InputField
                    label="Description"
                    value={step.description || ''}
                    onChange={(value) => {
                      const newSteps = [...(content.how_it_works?.steps || [])]
                      newSteps[index] = { ...newSteps[index], description: value }
                      setContent(prev => ({ ...prev, how_it_works: { ...prev.how_it_works, steps: newSteps } }))
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Benefits</h2>
            <InputField
              label="Section Title"
              value={content.benefits?.title || ''}
              onChange={(value) => setContent(prev => ({ ...prev, benefits: { ...prev.benefits, title: value } }))}
            />
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {(content.benefits?.benefits || []).map((benefit: any, index: number) => (
                <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <InputField
                    label="Title"
                    value={benefit.title || ''}
                    onChange={(value) => {
                      const newBenefits = [...(content.benefits?.benefits || [])]
                      newBenefits[index] = { ...newBenefits[index], title: value }
                      setContent(prev => ({ ...prev, benefits: { ...prev.benefits, benefits: newBenefits } }))
                    }}
                  />
                  <InputField
                    label="Description"
                    value={benefit.description || ''}
                    onChange={(value) => {
                      const newBenefits = [...(content.benefits?.benefits || [])]
                      newBenefits[index] = { ...newBenefits[index], description: value }
                      setContent(prev => ({ ...prev, benefits: { ...prev.benefits, benefits: newBenefits } }))
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Pricing</h2>
            <InputField
              label="Section Title"
              value={content.pricing?.title || ''}
              onChange={(value) => setContent(prev => ({ ...prev, pricing: { ...prev.pricing, title: value } }))}
            />
            <InputField
              label="Section Subtitle"
              value={content.pricing?.subtitle || ''}
              onChange={(value) => setContent(prev => ({ ...prev, pricing: { ...prev.pricing, subtitle: value } }))}
            />
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {(content.pricing?.plans || []).map((plan: any, index: number) => (
                <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <InputField
                    label="Plan Name"
                    value={plan.name || ''}
                    onChange={(value) => {
                      const newPlans = [...(content.pricing?.plans || [])]
                      newPlans[index] = { ...newPlans[index], name: value }
                      setContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }))
                    }}
                  />
                  <InputField
                    label="Price"
                    value={plan.price || ''}
                    onChange={(value) => {
                      const newPlans = [...(content.pricing?.plans || [])]
                      newPlans[index] = { ...newPlans[index], price: value }
                      setContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }))
                    }}
                  />
                  <InputField
                    label="Description"
                    value={plan.description || ''}
                    onChange={(value) => {
                      const newPlans = [...(content.pricing?.plans || [])]
                      newPlans[index] = { ...newPlans[index], description: value }
                      setContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }))
                    }}
                  />
                  <InputField
                    label="Features (comma-separated)"
                    value={(plan.features || []).join(', ')}
                    onChange={(value) => {
                      const newPlans = [...(content.pricing?.plans || [])]
                      newPlans[index] = { ...newPlans[index], features: value.split(',').map((f: string) => f.trim()).filter(Boolean) }
                      setContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }))
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">FAQ</h2>
              <button
                onClick={() => {
                  const newQuestions = [...(content.faq?.questions || [])]
                  newQuestions.push({ question: '', answer: '' })
                  setContent(prev => ({ ...prev, faq: { ...prev.faq, questions: newQuestions } }))
                }}
                className="text-sm text-green-500 hover:text-green-400"
              >
                + Add Question
              </button>
            </div>
            <InputField
              label="Section Title"
              value={content.faq?.title || ''}
              onChange={(value) => setContent(prev => ({ ...prev, faq: { ...prev.faq, title: value } }))}
            />
            <div className="space-y-4 mt-4">
              {(content.faq?.questions || []).map((q: any, index: number) => (
                <div key={index} className="p-4 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    onClick={() => {
                      const newQuestions = content.faq?.questions.filter((_: any, i: number) => i !== index)
                      setContent(prev => ({ ...prev, faq: { ...prev.faq, questions: newQuestions } }))
                    }}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <InputField
                    label="Question"
                    value={q.question || ''}
                    onChange={(value) => {
                      const newQuestions = [...(content.faq?.questions || [])]
                      newQuestions[index] = { ...newQuestions[index], question: value }
                      setContent(prev => ({ ...prev, faq: { ...prev.faq, questions: newQuestions } }))
                    }}
                  />
                  <InputField
                    label="Answer"
                    value={q.answer || ''}
                    onChange={(value) => {
                      const newQuestions = [...(content.faq?.questions || [])]
                      newQuestions[index] = { ...newQuestions[index], answer: value }
                      setContent(prev => ({ ...prev, faq: { ...prev.faq, questions: newQuestions } }))
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Final CTA</h2>
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
