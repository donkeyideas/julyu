'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin-v2/Sidebar'

interface SeoSettings {
  site_name: string
  tagline: string
  meta_description: string
  meta_keywords: string[]
  og_image_url: string
  twitter_handle: string
  google_verification: string
  bing_verification: string
}

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<SeoSettings>({
    site_name: 'Julyu',
    tagline: 'The Bloomberg Terminal for Grocery Consumers',
    meta_description: 'AI-powered grocery price comparison across 50+ retailers. Save $287/month with professional-grade tools.',
    meta_keywords: [
      'grocery price comparison',
      'food prices',
      'save money groceries',
      'grocery shopping app',
      'price tracker',
      'receipt scanner',
    ],
    og_image_url: '/og-image.png',
    twitter_handle: '@julyu',
    google_verification: '',
    bing_verification: '',
  })
  const [newKeyword, setNewKeyword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'seo', value: settings }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'SEO settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.meta_keywords.includes(newKeyword.trim())) {
      setSettings({
        ...settings,
        meta_keywords: [...settings.meta_keywords, newKeyword.trim()],
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      meta_keywords: settings.meta_keywords.filter(k => k !== keyword),
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <main className="ml-[280px] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">SEO Settings</h1>
              <p className="text-gray-400">Manage global SEO configuration for the website</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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

          {/* Settings Form */}
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Meta Description</label>
                  <textarea
                    value={settings.meta_description}
                    onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{settings.meta_description.length}/160 characters</p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">Meta Keywords</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {settings.meta_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-red-400 transition"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Add keyword..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={addKeyword}
                  className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">Social Media & Open Graph</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">OG Image URL</label>
                  <input
                    type="text"
                    value={settings.og_image_url}
                    onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="/og-image.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x630 pixels</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Twitter Handle</label>
                  <input
                    type="text"
                    value={settings.twitter_handle}
                    onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="@julyu"
                  />
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">Search Engine Verification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Google Search Console</label>
                  <input
                    type="text"
                    value={settings.google_verification}
                    onChange={(e) => setSettings({ ...settings, google_verification: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="Verification code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bing Webmaster</label>
                  <input
                    type="text"
                    value={settings.bing_verification}
                    onChange={(e) => setSettings({ ...settings, bing_verification: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                    placeholder="Verification code"
                  />
                </div>
              </div>
            </div>

            {/* SEO Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6">SEO Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm text-gray-400">robots.txt</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm text-gray-400">sitemap.xml</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm text-gray-400">Open Graph</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm text-gray-400">JSON-LD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
