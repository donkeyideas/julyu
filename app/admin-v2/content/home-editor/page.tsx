'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin-v2/Sidebar'

interface HeroContent {
  headline: string
  subheadline: string
  cta_primary: { text: string; href: string }
  cta_secondary: { text: string; href: string }
}

interface Stat {
  id: string
  stat_key: string
  label: string
  value: string
  prefix: string
  suffix: string
  numeric_value: number
  display_order: number
  is_active: boolean
}

interface Section {
  id: string
  section_key: string
  section_title: string
  content: any
  display_order: number
  is_visible: boolean
}

export default function HomeEditorPage() {
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [heroContent, setHeroContent] = useState<HeroContent>({
    headline: 'The Bloomberg Terminal for Grocery Consumers',
    subheadline: 'AI-powered price intelligence across 50+ retailers. Save $287/month with professional-grade tools.',
    cta_primary: { text: 'Start Saving Today', href: '/auth/signup' },
    cta_secondary: { text: 'Try Demo', href: '#demo' },
  })
  const [stats, setStats] = useState<Stat[]>([
    { id: '1', stat_key: 'total_savings', label: 'Total Savings', value: '4.2', prefix: '$', suffix: 'M', numeric_value: 4200000, display_order: 1, is_active: true },
    { id: '2', stat_key: 'active_users', label: 'Active Users', value: '127', prefix: '', suffix: 'K', numeric_value: 127000, display_order: 2, is_active: true },
    { id: '3', stat_key: 'avg_savings', label: 'Avg. Savings', value: '23', prefix: '', suffix: '%', numeric_value: 23, display_order: 3, is_active: true },
  ])
  const [sections, setSections] = useState<Section[]>([
    { id: '1', section_key: 'hero', section_title: 'Hero Section', content: {}, display_order: 1, is_visible: true },
    { id: '2', section_key: 'demo', section_title: 'Interactive Demo', content: {}, display_order: 2, is_visible: true },
    { id: '3', section_key: 'how_it_works', section_title: 'How It Works', content: {}, display_order: 3, is_visible: true },
    { id: '4', section_key: 'stats', section_title: 'Animated Stats', content: {}, display_order: 4, is_visible: true },
    { id: '5', section_key: 'features', section_title: 'Feature Showcase', content: {}, display_order: 5, is_visible: true },
    { id: '6', section_key: 'testimonials', section_title: 'Testimonials', content: {}, display_order: 6, is_visible: true },
    { id: '7', section_key: 'cta', section_title: 'CTA Section', content: {}, display_order: 7, is_visible: true },
  ])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/content/pages/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero: heroContent,
          stats: stats,
          sections: sections,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Home page content saved successfully!' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save content' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save content. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleSectionVisibility = (sectionKey: string) => {
    setSections(prev =>
      prev.map(s =>
        s.section_key === sectionKey ? { ...s, is_visible: !s.is_visible } : s
      )
    )
  }

  const updateStat = (index: number, field: keyof Stat, value: any) => {
    setStats(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <main className="ml-[280px] p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Home Page Editor</h1>
              <p className="text-gray-400">Manage the content displayed on the home page</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/"
                target="_blank"
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Preview
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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

          <div className="grid grid-cols-4 gap-8">
            {/* Section List */}
            <div className="col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="font-semibold mb-4 text-gray-300">Sections</h3>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.section_key}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                        activeSection === section.section_key
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      onClick={() => setActiveSection(section.section_key)}
                    >
                      <span className={section.is_visible ? 'text-white' : 'text-gray-500 line-through'}>
                        {section.section_title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSectionVisibility(section.section_key)
                        }}
                        className={`p-1 rounded ${section.is_visible ? 'text-green-500' : 'text-gray-500'}`}
                      >
                        {section.is_visible ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor Panel */}
            <div className="col-span-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {/* Hero Section Editor */}
                {activeSection === 'hero' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Edit Hero Section</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Main Headline
                      </label>
                      <input
                        type="text"
                        value={heroContent.headline}
                        onChange={(e) => setHeroContent({ ...heroContent, headline: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Subheadline
                      </label>
                      <textarea
                        value={heroContent.subheadline}
                        onChange={(e) => setHeroContent({ ...heroContent, subheadline: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Primary CTA Text
                        </label>
                        <input
                          type="text"
                          value={heroContent.cta_primary.text}
                          onChange={(e) =>
                            setHeroContent({
                              ...heroContent,
                              cta_primary: { ...heroContent.cta_primary, text: e.target.value },
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Primary CTA Link
                        </label>
                        <input
                          type="text"
                          value={heroContent.cta_primary.href}
                          onChange={(e) =>
                            setHeroContent({
                              ...heroContent,
                              cta_primary: { ...heroContent.cta_primary, href: e.target.value },
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Secondary CTA Text
                        </label>
                        <input
                          type="text"
                          value={heroContent.cta_secondary.text}
                          onChange={(e) =>
                            setHeroContent({
                              ...heroContent,
                              cta_secondary: { ...heroContent.cta_secondary, text: e.target.value },
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Secondary CTA Link
                        </label>
                        <input
                          type="text"
                          value={heroContent.cta_secondary.href}
                          onChange={(e) =>
                            setHeroContent({
                              ...heroContent,
                              cta_secondary: { ...heroContent.cta_secondary, href: e.target.value },
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Editor */}
                {activeSection === 'stats' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Edit Animated Stats</h3>

                    {stats.map((stat, index) => (
                      <div key={stat.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Label</label>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => updateStat(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Value</label>
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => updateStat(index, 'value', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Prefix</label>
                            <input
                              type="text"
                              value={stat.prefix}
                              onChange={(e) => updateStat(index, 'prefix', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                              placeholder="e.g., $"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Suffix</label>
                            <input
                              type="text"
                              value={stat.suffix}
                              onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                              placeholder="e.g., M, K, %"
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-500">
                          Preview: <span className="text-green-500 font-bold">{stat.prefix}{stat.value}{stat.suffix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Demo Section */}
                {activeSection === 'demo' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Interactive Demo</h3>
                    <p className="text-gray-400">
                      The interactive demo uses real Kroger API data. Users enter their zip code
                      and can compare prices across nearby stores.
                    </p>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500">
                        This section is automatically populated with real-time data from the Kroger API.
                        No manual content editing is required.
                      </p>
                    </div>
                  </div>
                )}

                {/* How It Works */}
                {activeSection === 'how_it_works' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">How It Works Section</h3>
                    <p className="text-gray-400 mb-4">
                      This section explains the 3-step process to users.
                    </p>
                    <div className="space-y-4">
                      {['Scan Your Receipts', 'We Track Prices', 'Save Money'].map((step, i) => (
                        <div key={i} className="p-4 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="w-10 h-10 bg-green-500 text-black font-bold rounded-full flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-white font-medium">{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {activeSection === 'features' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Feature Showcase</h3>
                    <p className="text-gray-400 mb-4">
                      Displays 6 key features with icons and descriptions.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Receipt Scanning', color: 'green' },
                        { title: 'Price Alerts', color: 'blue' },
                        { title: 'Smart Lists', color: 'purple' },
                        { title: 'Price Comparison', color: 'orange' },
                        { title: 'Savings Analytics', color: 'pink' },
                        { title: 'Store Finder', color: 'cyan' },
                      ].map((feature, i) => (
                        <div key={i} className="p-4 bg-gray-800 rounded-lg flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-${feature.color}-500`}></div>
                          <span className="text-white">{feature.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testimonials */}
                {activeSection === 'testimonials' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Testimonials Section</h3>
                    <p className="text-gray-400 mb-4">
                      Manage testimonials from the dedicated testimonials page.
                    </p>
                    <a
                      href="/admin-v2/content/testimonials"
                      className="inline-block px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      Manage Testimonials
                    </a>
                  </div>
                )}

                {/* CTA */}
                {activeSection === 'cta' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">CTA Section</h3>
                    <p className="text-gray-400 mb-4">
                      The call-to-action section at the bottom of the page.
                    </p>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <p className="text-white font-semibold mb-2">Current Message:</p>
                      <p className="text-gray-300">&ldquo;Start Saving Today - Join 127,000+ smart shoppers&rdquo;</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
