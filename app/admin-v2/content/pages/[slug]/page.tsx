'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface PageData {
  title: string
  headline: string
  subheadline: string
  meta_description: string
  content: {
    email?: string
    about_text?: string
  }
}

// Default content that matches the actual website pages
const defaultPageData: Record<string, PageData> = {
  features: {
    title: 'Features',
    headline: 'Everything You Need to Never Overpay',
    subheadline: 'AI-powered platform with real-time pricing and intelligent optimization',
    meta_description: 'Explore all features of Julyu grocery price comparison.',
    content: {},
  },
  pricing: {
    title: 'Pricing',
    headline: 'Simple Transparent Pricing',
    subheadline: 'Professional grocery intelligence for everyone',
    meta_description: 'Simple, transparent pricing for Julyu.',
    content: {},
  },
  about: {
    title: 'About Us',
    headline: 'About Julyu',
    subheadline: 'The Bloomberg Terminal for Grocery Consumers',
    meta_description: 'Learn about the team behind Julyu.',
    content: {
      about_text: 'Julyu is an AI-powered grocery price comparison platform that helps consumers save money by comparing prices across 50+ retailers. Our mission is to make grocery shopping more transparent and affordable for everyone.',
    },
  },
  contact: {
    title: 'Contact',
    headline: 'Contact Us',
    subheadline: 'Get in touch with the Julyu team',
    meta_description: 'Get in touch with the Julyu team.',
    content: {
      email: 'contact@julyu.com',
    },
  },
}

export default function EditPagePage() {
  const params = useParams()
  const slug = params.slug as string

  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPageData()
  }, [slug])

  const loadPageData = async () => {
    setLoading(true)
    try {
      // Fetch from database
      const response = await fetch(`/api/admin/content/pages?slug=${slug}`)
      const result = await response.json()

      if (result.page) {
        setPageData({
          title: result.page.title,
          headline: result.page.headline,
          subheadline: result.page.subheadline,
          meta_description: result.page.meta_description,
          content: result.page.content || {},
        })
      } else {
        // Use default data
        setPageData(defaultPageData[slug] || {
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          headline: '',
          subheadline: '',
          meta_description: '',
          content: {},
        })
      }
    } catch (error) {
      console.error('Error loading page:', error)
      setPageData(defaultPageData[slug] || {
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        headline: '',
        subheadline: '',
        meta_description: '',
        content: {},
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!pageData) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/content/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data: pageData }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Page saved successfully! Changes will appear on the live site.' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save page' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save page' })
    } finally {
      setSaving(false)
    }
  }

  const updateContent = (key: string, value: string) => {
    if (!pageData) return
    setPageData({
      ...pageData,
      content: { ...pageData.content, [key]: value },
    })
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

      {/* Contact Page - Email Editor */}
      {slug === 'contact' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
            <input
              type="email"
              value={pageData.content.email || ''}
              onChange={(e) => updateContent('email', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
              placeholder="contact@julyu.com"
            />
            <p className="text-sm text-gray-500 mt-2">This email will be displayed on the Contact page.</p>
          </div>
        </div>
      )}

      {/* About Page - Text Editor */}
      {slug === 'about' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-6">About Content</h3>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Mission Statement</label>
            <textarea
              value={pageData.content.about_text || ''}
              onChange={(e) => updateContent('about_text', e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">This text will be displayed in the &quot;Our Mission&quot; section.</p>
          </div>
        </div>
      )}

      {/* Features/Pricing Info */}
      {(slug === 'features' || slug === 'pricing') && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Page Content</h3>
          <p className="text-gray-400 text-sm">
            The {slug} page content (feature cards, pricing tiers) is managed in the codebase.
            You can edit the page title, headline, and SEO settings above.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-2">How It Works</h3>
        <p className="text-gray-400 text-sm">
          Changes saved here are stored in the database and will appear on the live website.
          Click &quot;Save Changes&quot; when you&apos;re done editing.
        </p>
      </div>
    </div>
  )
}
