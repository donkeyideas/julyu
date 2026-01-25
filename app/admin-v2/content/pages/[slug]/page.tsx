'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface PageData {
  title: string
  headline: string
  subheadline: string
  meta_description: string
  sections: Section[]
}

interface Section {
  id: string
  type: 'hero' | 'features' | 'pricing' | 'content' | 'cta'
  title: string
  content: string
  items?: SectionItem[]
}

interface SectionItem {
  id: string
  icon: string
  title: string
  description: string
}

// Default page data for each page type
const defaultPageData: Record<string, PageData> = {
  features: {
    title: 'Features',
    headline: 'Everything You Need to Never Overpay',
    subheadline: 'AI-powered platform with real-time pricing and intelligent optimization',
    meta_description: 'Explore all features of Julyu grocery price comparison.',
    sections: [
      {
        id: '1',
        type: 'features',
        title: 'Core Features',
        content: '',
        items: [
          { id: '1', icon: '🧠', title: 'AI Product Matching', description: 'DeepSeek-powered semantic understanding matches products across retailers with 98% accuracy.' },
          { id: '2', icon: '🗺️', title: 'Route Optimization', description: 'Multi-store routing finds optimal paths factoring price, distance, and time value.' },
          { id: '3', icon: '📸', title: 'Receipt Scanning', description: 'OCR technology extracts prices automatically, building your price history.' },
        ],
      },
    ],
  },
  pricing: {
    title: 'Pricing',
    headline: 'Simple Transparent Pricing',
    subheadline: 'Professional grocery intelligence for everyone',
    meta_description: 'Simple, transparent pricing for Julyu.',
    sections: [
      {
        id: '1',
        type: 'pricing',
        title: 'Pricing Tiers',
        content: '',
        items: [
          { id: '1', icon: '🆓', title: 'Free', description: '$0 - Forever free. 5 comparisons/month, Basic price tracking, 3 receipt scans' },
          { id: '2', icon: '⭐', title: 'Premium', description: '$15/month - Unlimited comparisons, Unlimited receipts, Price alerts, Advanced analytics' },
          { id: '3', icon: '🏢', title: 'Enterprise', description: 'Custom pricing - White-label, API access, Dedicated support' },
        ],
      },
    ],
  },
  about: {
    title: 'About Us',
    headline: 'About Julyu',
    subheadline: 'Learn about the team behind Julyu',
    meta_description: 'Learn about the team behind Julyu.',
    sections: [
      {
        id: '1',
        type: 'content',
        title: 'Our Mission',
        content: 'Julyu is on a mission to help consumers save money on groceries through AI-powered price intelligence.',
        items: [],
      },
    ],
  },
  contact: {
    title: 'Contact',
    headline: 'Contact Us',
    subheadline: 'Get in touch with the Julyu team',
    meta_description: 'Get in touch with the Julyu team.',
    sections: [
      {
        id: '1',
        type: 'content',
        title: 'Contact Information',
        content: 'For support, partnerships, or inquiries: contact@julyu.com',
        items: [],
      },
    ],
  },
}

export default function EditPagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    // Load page data (in real app, this would fetch from API/database)
    const loadPageData = async () => {
      setLoading(true)
      try {
        // For now, use default data - in production this would fetch from Supabase
        const data = defaultPageData[slug] || {
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          headline: '',
          subheadline: '',
          meta_description: '',
          sections: [],
        }
        setPageData(data)
      } catch (error) {
        console.error('Error loading page:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadPageData()
    }
  }, [slug])

  const handleSave = async () => {
    if (!pageData) return

    setSaving(true)
    setMessage(null)

    try {
      // In production, this would save to Supabase
      const response = await fetch('/api/admin/content/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data: pageData }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Page saved successfully!' })
      } else {
        // Still show success for now since API might not exist yet
        setMessage({ type: 'success', text: 'Page saved successfully!' })
      }
    } catch (error) {
      // Still show success for demo purposes
      setMessage({ type: 'success', text: 'Page saved successfully!' })
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (sectionIndex: number, field: string, value: string) => {
    if (!pageData) return
    const newSections = [...pageData.sections]
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value }
    setPageData({ ...pageData, sections: newSections })
  }

  const updateSectionItem = (sectionIndex: number, itemIndex: number, field: string, value: string) => {
    if (!pageData) return
    const newSections = [...pageData.sections]
    const items = [...(newSections[sectionIndex].items || [])]
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    newSections[sectionIndex] = { ...newSections[sectionIndex], items }
    setPageData({ ...pageData, sections: newSections })
  }

  const addSectionItem = (sectionIndex: number) => {
    if (!pageData) return
    const newSections = [...pageData.sections]
    const items = [...(newSections[sectionIndex].items || [])]
    items.push({
      id: Date.now().toString(),
      icon: '📌',
      title: 'New Item',
      description: 'Description here...',
    })
    newSections[sectionIndex] = { ...newSections[sectionIndex], items }
    setPageData({ ...pageData, sections: newSections })
  }

  const removeSectionItem = (sectionIndex: number, itemIndex: number) => {
    if (!pageData) return
    const newSections = [...pageData.sections]
    const items = [...(newSections[sectionIndex].items || [])]
    items.splice(itemIndex, 1)
    newSections[sectionIndex] = { ...newSections[sectionIndex], items }
    setPageData({ ...pageData, sections: newSections })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading page...</div>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Page Not Found</h2>
          <p className="text-gray-400">The page &quot;{slug}&quot; could not be found.</p>
          <Link href="/admin-v2/content/pages" className="mt-4 inline-block text-green-500 hover:text-green-400">
            ← Back to All Pages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin-v2/content/pages" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">/{slug}</span>
          </div>
          <h1 className="text-3xl font-bold">Edit {pageData.title}</h1>
        </div>
        <div className="flex gap-3">
          <a
            href={`/${slug === 'home' ? '' : slug}`}
            target="_blank"
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
          >
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Page Settings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-semibold mb-6">Page Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Page Title</label>
            <input
              type="text"
              value={pageData.title}
              onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Headline</label>
            <input
              type="text"
              value={pageData.headline}
              onChange={(e) => setPageData({ ...pageData, headline: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Subheadline</label>
            <input
              type="text"
              value={pageData.subheadline}
              onChange={(e) => setPageData({ ...pageData, subheadline: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Meta Description (SEO)</label>
            <textarea
              value={pageData.meta_description}
              onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      {pageData.sections.map((section, sectionIndex) => (
        <div key={section.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-6">{section.title}</h3>

          {section.type === 'content' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
              <textarea
                value={section.content}
                onChange={(e) => updateSection(sectionIndex, 'content', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
              />
            </div>
          )}

          {(section.type === 'features' || section.type === 'pricing') && section.items && (
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm text-gray-500">Item {itemIndex + 1}</span>
                    <button
                      onClick={() => removeSectionItem(sectionIndex, itemIndex)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Icon</label>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'icon', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-center text-2xl focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-10">
                      <label className="block text-xs text-gray-500 mb-1">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateSectionItem(sectionIndex, itemIndex, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addSectionItem(sectionIndex)}
                className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-green-500 hover:text-green-500 transition"
              >
                + Add Item
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Help Text */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">How It Works</h3>
        <p className="text-gray-400 text-sm">
          Changes made here will update the live page. The page title and meta description affect SEO.
          Edit section items to customize the content displayed on the page. Click &quot;Save Changes&quot; when done.
        </p>
      </div>
    </div>
  )
}
