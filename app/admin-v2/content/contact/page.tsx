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

export default function ContactPageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [content, setContent] = useState({
    hero: {
      headline: 'Get in Touch',
      subheadline: 'Have a question or feedback? We\'d love to hear from you.'
    },
    contact_info: {
      email: 'support@julyu.com',
      response_time: 'We typically respond within 24 hours'
    },
    support_options: {
      options: [
        { icon: 'email', title: 'Email Support', description: 'Send us an email and we\'ll get back to you within 24 hours.', action: 'support@julyu.com' },
        { icon: 'chat', title: 'Live Chat', description: 'Chat with our team in real-time during business hours.', action: 'Start Chat' },
        { icon: 'book', title: 'Help Center', description: 'Browse our knowledge base for answers to common questions.', action: '/help' }
      ]
    }
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/content/pages/contact')
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

      const response = await fetch('/api/admin/content/pages/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: {
            title: 'Contact - Julyu',
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
            <h1 className="text-3xl font-black mb-2">Contact Page Editor</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Edit the /contact page content
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/contact"
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

          {/* Contact Information */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Email Address"
                value={content.contact_info?.email || ''}
                onChange={(value) => setContent(prev => ({ ...prev, contact_info: { ...prev.contact_info, email: value } }))}
                placeholder="support@julyu.com"
              />
              <InputField
                label="Response Time"
                value={content.contact_info?.response_time || ''}
                onChange={(value) => setContent(prev => ({ ...prev, contact_info: { ...prev.contact_info, response_time: value } }))}
                placeholder="We typically respond within 24 hours"
              />
            </div>
          </div>

          {/* Support Options */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Support Options</h2>
              <button
                onClick={() => {
                  const newOptions = [...(content.support_options?.options || [])]
                  newOptions.push({ icon: 'help', title: '', description: '', action: '' })
                  setContent(prev => ({ ...prev, support_options: { options: newOptions } }))
                }}
                className="text-sm text-green-500 hover:text-green-400"
              >
                + Add Option
              </button>
            </div>
            <div className="space-y-4">
              {(content.support_options?.options || []).map((option: any, index: number) => (
                <div key={index} className="p-4 rounded-lg relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    onClick={() => {
                      const newOptions = content.support_options?.options.filter((_: any, i: number) => i !== index)
                      setContent(prev => ({ ...prev, support_options: { options: newOptions } }))
                    }}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <InputField
                    label="Title"
                    value={option.title || ''}
                    onChange={(value) => {
                      const newOptions = [...(content.support_options?.options || [])]
                      newOptions[index] = { ...newOptions[index], title: value }
                      setContent(prev => ({ ...prev, support_options: { options: newOptions } }))
                    }}
                  />
                  <InputField
                    label="Description"
                    value={option.description || ''}
                    onChange={(value) => {
                      const newOptions = [...(content.support_options?.options || [])]
                      newOptions[index] = { ...newOptions[index], description: value }
                      setContent(prev => ({ ...prev, support_options: { options: newOptions } }))
                    }}
                    multiline
                  />
                  <InputField
                    label="Action (email, link, or button text)"
                    value={option.action || ''}
                    onChange={(value) => {
                      const newOptions = [...(content.support_options?.options || [])]
                      newOptions[index] = { ...newOptions[index], action: value }
                      setContent(prev => ({ ...prev, support_options: { options: newOptions } }))
                    }}
                    placeholder="e.g., support@julyu.com or /help"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
