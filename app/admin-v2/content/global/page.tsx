'use client'

import { useState, useEffect } from 'react'

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

export default function GlobalSettingsEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [settings, setSettings] = useState({
    site_name: 'Julyu',
    tagline: 'The Bloomberg Terminal for Grocery Consumers',
    support_email: 'support@julyu.com',
    footer_text: 'AI-powered grocery intelligence that saves you hundreds monthly.',
    social_links: {
      twitter: 'https://twitter.com/julyu',
      facebook: 'https://facebook.com/julyu',
      instagram: 'https://instagram.com/julyu'
    },
    default_meta_title: 'Julyu - Stop Overpaying for Groceries',
    default_meta_description: 'Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with AI-powered intelligence.',
    google_analytics_id: '',
    facebook_pixel_id: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/content/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          // Merge loaded settings with defaults
          const loadedSettings: any = {}
          for (const setting of data.settings) {
            if (setting.key === 'social_links') {
              loadedSettings.social_links = setting.value
            } else {
              loadedSettings[setting.key] = typeof setting.value === 'string'
                ? setting.value.replace(/^"|"$/g, '')
                : setting.value
            }
          }
          setSettings(prev => ({ ...prev, ...loadedSettings }))
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)

      // Save each setting
      const settingsToSave = [
        { key: 'site_name', value: settings.site_name },
        { key: 'tagline', value: settings.tagline },
        { key: 'support_email', value: settings.support_email },
        { key: 'footer_text', value: settings.footer_text },
        { key: 'social_links', value: settings.social_links },
        { key: 'default_meta_title', value: settings.default_meta_title },
        { key: 'default_meta_description', value: settings.default_meta_description },
        { key: 'google_analytics_id', value: settings.google_analytics_id },
        { key: 'facebook_pixel_id', value: settings.facebook_pixel_id }
      ]

      for (const setting of settingsToSave) {
        await fetch('/api/admin/content/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        })
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
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
            <h1 className="text-3xl font-black mb-2">Global Settings</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Site-wide settings that apply to all pages
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Site Identity */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Site Identity</h2>
            <InputField
              label="Site Name"
              value={settings.site_name}
              onChange={(value) => setSettings(prev => ({ ...prev, site_name: value }))}
              placeholder="Julyu"
            />
            <InputField
              label="Tagline"
              value={settings.tagline}
              onChange={(value) => setSettings(prev => ({ ...prev, tagline: value }))}
              placeholder="The Bloomberg Terminal for Grocery Consumers"
            />
            <InputField
              label="Footer Text"
              value={settings.footer_text}
              onChange={(value) => setSettings(prev => ({ ...prev, footer_text: value }))}
              multiline
              placeholder="AI-powered grocery intelligence..."
            />
          </div>

          {/* Contact */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <InputField
              label="Support Email"
              value={settings.support_email}
              onChange={(value) => setSettings(prev => ({ ...prev, support_email: value }))}
              placeholder="support@julyu.com"
            />
          </div>

          {/* Social Links */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Social Links</h2>
            <InputField
              label="Twitter URL"
              value={settings.social_links?.twitter || ''}
              onChange={(value) => setSettings(prev => ({
                ...prev,
                social_links: { ...prev.social_links, twitter: value }
              }))}
              placeholder="https://twitter.com/julyu"
            />
            <InputField
              label="Facebook URL"
              value={settings.social_links?.facebook || ''}
              onChange={(value) => setSettings(prev => ({
                ...prev,
                social_links: { ...prev.social_links, facebook: value }
              }))}
              placeholder="https://facebook.com/julyu"
            />
            <InputField
              label="Instagram URL"
              value={settings.social_links?.instagram || ''}
              onChange={(value) => setSettings(prev => ({
                ...prev,
                social_links: { ...prev.social_links, instagram: value }
              }))}
              placeholder="https://instagram.com/julyu"
            />
          </div>

          {/* Default SEO */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Default SEO</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              These are used as fallbacks when a page doesn&apos;t have its own SEO settings.
            </p>
            <InputField
              label="Default Meta Title"
              value={settings.default_meta_title}
              onChange={(value) => setSettings(prev => ({ ...prev, default_meta_title: value }))}
              placeholder="Julyu - Stop Overpaying for Groceries"
            />
            <InputField
              label="Default Meta Description"
              value={settings.default_meta_description}
              onChange={(value) => setSettings(prev => ({ ...prev, default_meta_description: value }))}
              multiline
              placeholder="Compare prices across Kroger, Walmart..."
            />
          </div>

          {/* Analytics */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-4">Analytics & Tracking</h2>
            <InputField
              label="Google Analytics ID"
              value={settings.google_analytics_id}
              onChange={(value) => setSettings(prev => ({ ...prev, google_analytics_id: value }))}
              placeholder="G-XXXXXXXXXX"
              helpText="Your Google Analytics 4 Measurement ID"
            />
            <InputField
              label="Facebook Pixel ID"
              value={settings.facebook_pixel_id}
              onChange={(value) => setSettings(prev => ({ ...prev, facebook_pixel_id: value }))}
              placeholder="1234567890"
              helpText="Your Facebook Pixel ID for conversion tracking"
            />
          </div>
        </div>
      </div>
    </>
  )
}
