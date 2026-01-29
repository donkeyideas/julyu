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
    last_updated?: string
    contact_email?: string
    // Privacy Policy sections
    introduction?: string
    info_collect_account?: string
    info_collect_receipt?: string
    info_collect_lists?: string
    info_collect_location?: string
    info_collect_usage?: string
    how_we_use_intro?: string
    how_we_use_1?: string
    how_we_use_2?: string
    how_we_use_3?: string
    how_we_use_4?: string
    how_we_use_5?: string
    data_sharing_intro?: string
    data_sharing_providers?: string
    data_sharing_legal?: string
    data_sharing_transfers?: string
    data_security?: string
    your_rights_intro?: string
    your_rights_1?: string
    your_rights_2?: string
    your_rights_3?: string
    your_rights_4?: string
    your_rights_contact_text?: string
    cookies?: string
    children_privacy?: string
    changes_policy?: string
    contact_us_text?: string
    // Terms sections
    agreement?: string
    description_of_service_intro?: string
    description_of_service_1?: string
    description_of_service_2?: string
    description_of_service_3?: string
    description_of_service_4?: string
    user_accounts_intro?: string
    user_accounts_1?: string
    user_accounts_2?: string
    user_accounts_3?: string
    user_accounts_4?: string
    user_accounts_age?: string
    acceptable_use_intro?: string
    acceptable_use_1?: string
    acceptable_use_2?: string
    acceptable_use_3?: string
    acceptable_use_4?: string
    acceptable_use_5?: string
    acceptable_use_6?: string
    price_disclaimer?: string
    intellectual_property?: string
    user_content?: string
    third_party?: string
    liability?: string
    warranties?: string
    termination?: string
    governing_law?: string
    changes_terms?: string
    contact_us_terms_text?: string
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
  privacy: {
    title: 'Privacy Policy',
    headline: 'Privacy Policy',
    subheadline: 'How we collect, use, and protect your information',
    meta_description: 'How Julyu collects, uses, and protects your personal information.',
    content: {
      last_updated: 'January 26, 2025',
      contact_email: 'privacy@julyu.com',
      introduction: 'Julyu ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our grocery price comparison platform and services.',
      info_collect_account: 'When you create an account, we collect your email address, name, and password. If you sign in with Google, we receive your name, email, and profile picture from Google.',
      info_collect_receipt: 'When you scan receipts, we process the images to extract item names, prices, store information, and purchase dates. This data is used to provide price comparisons and savings insights.',
      info_collect_lists: 'We store the shopping lists you create, including item names and quantities, to provide price comparison features.',
      info_collect_location: 'With your permission, we may collect your zip code or general location to show relevant store prices in your area. We do not track your precise GPS location.',
      info_collect_usage: 'We collect information about how you use our service, including pages visited, features used, and interactions with the platform.',
      how_we_use_intro: 'We use your information to:',
      how_we_use_1: 'Provide and improve our price comparison services',
      how_we_use_2: 'Process and analyze your receipts for savings insights',
      how_we_use_3: 'Send you price alerts and notifications you\'ve requested',
      how_we_use_4: 'Communicate with you about your account and our services',
      how_we_use_5: 'Analyze usage patterns to improve the platform',
      data_sharing_intro: 'We do not sell your personal information. We may share your information only in the following circumstances:',
      data_sharing_providers: 'We use third-party services (hosting, analytics, AI processing) that may process your data on our behalf.',
      data_sharing_legal: 'We may disclose information if required by law or to protect our rights.',
      data_sharing_transfers: 'If Julyu is acquired or merged, your information may be transferred to the new entity.',
      data_security: 'We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS/TLS) and at rest. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
      your_rights_intro: 'You have the right to:',
      your_rights_1: 'Access and download your personal data',
      your_rights_2: 'Correct inaccurate information',
      your_rights_3: 'Delete your account and associated data',
      your_rights_4: 'Opt out of marketing communications',
      your_rights_contact_text: 'To exercise these rights, contact us at',
      cookies: 'We use essential cookies to maintain your session and remember your preferences. We may also use analytics cookies to understand how users interact with our platform. You can control cookies through your browser settings.',
      children_privacy: 'Julyu is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.',
      changes_policy: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.',
      contact_us_text: 'If you have questions about this Privacy Policy, please contact us at:',
    },
  },
  terms: {
    title: 'Terms of Service',
    headline: 'Terms of Service',
    subheadline: 'Terms and conditions for using Julyu',
    meta_description: 'Terms and conditions for using Julyu services.',
    content: {
      last_updated: 'January 26, 2025',
      contact_email: 'legal@julyu.com',
      agreement: 'By accessing or using Julyu ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. We reserve the right to update these terms at any time, and your continued use of the Service constitutes acceptance of any changes.',
      description_of_service_intro: 'Julyu is a grocery price comparison platform that provides:',
      description_of_service_1: 'Price comparison across participating grocery retailers',
      description_of_service_2: 'Receipt scanning and spending analysis',
      description_of_service_3: 'Shopping list management and optimization',
      description_of_service_4: 'Price alerts and notifications',
      user_accounts_intro: 'To access certain features, you must create an account. You agree to:',
      user_accounts_1: 'Provide accurate and complete information when creating your account',
      user_accounts_2: 'Maintain the security of your account credentials',
      user_accounts_3: 'Notify us immediately of any unauthorized access to your account',
      user_accounts_4: 'Be responsible for all activities that occur under your account',
      user_accounts_age: 'You must be at least 13 years old to create an account and use the Service.',
      acceptable_use_intro: 'You agree not to use the Service to:',
      acceptable_use_1: 'Violate any applicable laws or regulations',
      acceptable_use_2: 'Infringe on the rights of others',
      acceptable_use_3: 'Attempt to gain unauthorized access to our systems',
      acceptable_use_4: 'Use automated scripts or bots to access the Service',
      acceptable_use_5: 'Scrape or harvest data from the Service for commercial purposes',
      acceptable_use_6: 'Upload malicious content or interfere with the Service\'s operation',
      price_disclaimer: 'Price information is provided for informational purposes only. While we strive to provide accurate and up-to-date pricing information, we cannot guarantee the accuracy, completeness, or timeliness of price data. Prices may vary by location, change without notice, and may differ from actual in-store prices. Always verify prices at the point of purchase.',
      intellectual_property: 'The Service and its original content, features, and functionality are owned by Julyu and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our Service without our express written permission.',
      user_content: 'You retain ownership of content you upload to the Service (such as receipts and shopping lists). By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and analyze this content to provide and improve the Service. You represent that you have the right to upload any content you submit.',
      third_party: 'The Service may contain links to third-party websites or services (such as retailer websites or delivery partners). We are not responsible for the content, privacy policies, or practices of any third-party sites or services. Your interactions with third parties are solely between you and the third party.',
      liability: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, JULYU SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR SAVINGS, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, IF ANY.',
      warranties: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.',
      termination: 'We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason. You may also delete your account at any time through your account settings.',
      governing_law: 'These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts located in the United States.',
      changes_terms: 'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the modified Terms.',
      contact_us_terms_text: 'If you have questions about these Terms of Service, please contact us at:',
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
      // Get defaults for this page
      const defaults = defaultPageData[slug] || {
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        headline: '',
        subheadline: '',
        meta_description: '',
        content: {},
      }

      // Fetch from database
      const response = await fetch(`/api/admin/content/pages?slug=${slug}`)
      const result = await response.json()

      if (result.page) {
        // Merge database content with defaults - database values override defaults
        setPageData({
          title: result.page.title || defaults.title,
          headline: result.page.headline || defaults.headline,
          subheadline: result.page.subheadline || defaults.subheadline,
          meta_description: result.page.meta_description || defaults.meta_description,
          content: {
            ...defaults.content,  // Start with defaults
            ...(result.page.content || {}),  // Override with database values
          },
        })
      } else {
        // Use default data
        setPageData(defaults)
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
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading page...</div>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Page Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The page &quot;{slug}&quot; could not be found.</p>
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
            <Link href="/admin-v2/content/pages" className="hover:text-green-500 transition" style={{ color: 'var(--text-secondary)' }}>
              ← Back
            </Link>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>/{slug}</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit {pageData.title}</h1>
        </div>
        <div className="flex gap-3">
          <a
            href={`/${slug === 'home' ? '' : slug}`}
            target="_blank"
            className="px-4 py-2 rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Page Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Page Title</label>
            <input
              type="text"
              value={pageData.title}
              onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Headline</label>
            <input
              type="text"
              value={pageData.headline}
              onChange={(e) => setPageData({ ...pageData, headline: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Subheadline</label>
            <input
              type="text"
              value={pageData.subheadline}
              onChange={(e) => setPageData({ ...pageData, subheadline: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Meta Description (SEO)</label>
            <textarea
              value={pageData.meta_description}
              onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Contact Page - Email Editor */}
      {slug === 'contact' && (
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Contact Information</h3>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Email</label>
            <input
              type="email"
              value={pageData.content.email || ''}
              onChange={(e) => updateContent('email', e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="contact@julyu.com"
            />
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>This email will be displayed on the Contact page.</p>
          </div>
        </div>
      )}

      {/* About Page - Text Editor */}
      {slug === 'about' && (
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>About Content</h3>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Mission Statement</label>
            <textarea
              value={pageData.content.about_text || ''}
              onChange={(e) => updateContent('about_text', e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>This text will be displayed in the &quot;Our Mission&quot; section.</p>
          </div>
        </div>
      )}

      {/* Features/Pricing Info */}
      {(slug === 'features' || slug === 'pricing') && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Page Content</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            The {slug} page content (feature cards, pricing tiers) is managed in the codebase.
            You can edit the page title, headline, and SEO settings above.
          </p>
        </div>
      )}

      {/* Privacy Policy Editor */}
      {slug === 'privacy' && (
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Privacy Policy Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Last Updated Date</label>
                <input
                  type="text"
                  value={pageData.content.last_updated || ''}
                  onChange={(e) => updateContent('last_updated', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="January 26, 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Email</label>
                <input
                  type="email"
                  value={pageData.content.contact_email || ''}
                  onChange={(e) => updateContent('contact_email', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="privacy@julyu.com"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Introduction</h3>
            <textarea
              value={pageData.content.introduction || ''}
              onChange={(e) => updateContent('introduction', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Information We Collect</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Account Information</label>
                <textarea
                  value={pageData.content.info_collect_account || ''}
                  onChange={(e) => updateContent('info_collect_account', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Receipt Data</label>
                <textarea
                  value={pageData.content.info_collect_receipt || ''}
                  onChange={(e) => updateContent('info_collect_receipt', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Shopping Lists</label>
                <textarea
                  value={pageData.content.info_collect_lists || ''}
                  onChange={(e) => updateContent('info_collect_lists', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Location Information</label>
                <textarea
                  value={pageData.content.info_collect_location || ''}
                  onChange={(e) => updateContent('info_collect_location', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Usage Data</label>
                <textarea
                  value={pageData.content.info_collect_usage || ''}
                  onChange={(e) => updateContent('info_collect_usage', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>How We Use Your Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction Text</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_intro || ''}
                  onChange={(e) => updateContent('how_we_use_intro', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Item 1</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_1 || ''}
                  onChange={(e) => updateContent('how_we_use_1', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Item 2</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_2 || ''}
                  onChange={(e) => updateContent('how_we_use_2', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Item 3</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_3 || ''}
                  onChange={(e) => updateContent('how_we_use_3', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Item 4</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_4 || ''}
                  onChange={(e) => updateContent('how_we_use_4', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Item 5</label>
                <input
                  type="text"
                  value={pageData.content.how_we_use_5 || ''}
                  onChange={(e) => updateContent('how_we_use_5', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Data Sharing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction Text</label>
                <textarea
                  value={pageData.content.data_sharing_intro || ''}
                  onChange={(e) => updateContent('data_sharing_intro', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Service Providers</label>
                <textarea
                  value={pageData.content.data_sharing_providers || ''}
                  onChange={(e) => updateContent('data_sharing_providers', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Legal Requirements</label>
                <textarea
                  value={pageData.content.data_sharing_legal || ''}
                  onChange={(e) => updateContent('data_sharing_legal', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Business Transfers</label>
                <textarea
                  value={pageData.content.data_sharing_transfers || ''}
                  onChange={(e) => updateContent('data_sharing_transfers', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Data Security</h3>
            <textarea
              value={pageData.content.data_security || ''}
              onChange={(e) => updateContent('data_security', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Your Rights</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction Text</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_intro || ''}
                  onChange={(e) => updateContent('your_rights_intro', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Right 1</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_1 || ''}
                  onChange={(e) => updateContent('your_rights_1', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Right 2</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_2 || ''}
                  onChange={(e) => updateContent('your_rights_2', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Right 3</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_3 || ''}
                  onChange={(e) => updateContent('your_rights_3', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Right 4</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_4 || ''}
                  onChange={(e) => updateContent('your_rights_4', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Text (before email link)</label>
                <input
                  type="text"
                  value={pageData.content.your_rights_contact_text || ''}
                  onChange={(e) => updateContent('your_rights_contact_text', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Cookies</h3>
            <textarea
              value={pageData.content.cookies || ''}
              onChange={(e) => updateContent('cookies', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Children&apos;s Privacy</h3>
            <textarea
              value={pageData.content.children_privacy || ''}
              onChange={(e) => updateContent('children_privacy', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Changes to This Policy</h3>
            <textarea
              value={pageData.content.changes_policy || ''}
              onChange={(e) => updateContent('changes_policy', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Contact Us</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Section Text</label>
                <textarea
                  value={pageData.content.contact_us_text || ''}
                  onChange={(e) => updateContent('contact_us_text', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>The contact email is set in the Privacy Policy Settings section above.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Editor */}
      {slug === 'terms' && (
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Terms Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Last Updated Date</label>
                <input
                  type="text"
                  value={pageData.content.last_updated || ''}
                  onChange={(e) => updateContent('last_updated', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="January 26, 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Email</label>
                <input
                  type="email"
                  value={pageData.content.contact_email || ''}
                  onChange={(e) => updateContent('contact_email', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="legal@julyu.com"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Agreement to Terms</h3>
            <textarea
              value={pageData.content.agreement || ''}
              onChange={(e) => updateContent('agreement', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Description of Service</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction Text</label>
                <input
                  type="text"
                  value={pageData.content.description_of_service_intro || ''}
                  onChange={(e) => updateContent('description_of_service_intro', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Service 1</label>
                <input
                  type="text"
                  value={pageData.content.description_of_service_1 || ''}
                  onChange={(e) => updateContent('description_of_service_1', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Service 2</label>
                <input
                  type="text"
                  value={pageData.content.description_of_service_2 || ''}
                  onChange={(e) => updateContent('description_of_service_2', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Service 3</label>
                <input
                  type="text"
                  value={pageData.content.description_of_service_3 || ''}
                  onChange={(e) => updateContent('description_of_service_3', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Service 4</label>
                <input
                  type="text"
                  value={pageData.content.description_of_service_4 || ''}
                  onChange={(e) => updateContent('description_of_service_4', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>User Accounts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_intro || ''}
                  onChange={(e) => updateContent('user_accounts_intro', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Requirement 1</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_1 || ''}
                  onChange={(e) => updateContent('user_accounts_1', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Requirement 2</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_2 || ''}
                  onChange={(e) => updateContent('user_accounts_2', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Requirement 3</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_3 || ''}
                  onChange={(e) => updateContent('user_accounts_3', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Requirement 4</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_4 || ''}
                  onChange={(e) => updateContent('user_accounts_4', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Age Requirement</label>
                <input
                  type="text"
                  value={pageData.content.user_accounts_age || ''}
                  onChange={(e) => updateContent('user_accounts_age', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Acceptable Use</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Introduction</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_intro || ''}
                  onChange={(e) => updateContent('acceptable_use_intro', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 1</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_1 || ''}
                  onChange={(e) => updateContent('acceptable_use_1', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 2</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_2 || ''}
                  onChange={(e) => updateContent('acceptable_use_2', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 3</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_3 || ''}
                  onChange={(e) => updateContent('acceptable_use_3', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 4</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_4 || ''}
                  onChange={(e) => updateContent('acceptable_use_4', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 5</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_5 || ''}
                  onChange={(e) => updateContent('acceptable_use_5', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prohibited Action 6</label>
                <input
                  type="text"
                  value={pageData.content.acceptable_use_6 || ''}
                  onChange={(e) => updateContent('acceptable_use_6', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Price Information Disclaimer</h3>
            <textarea
              value={pageData.content.price_disclaimer || ''}
              onChange={(e) => updateContent('price_disclaimer', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Intellectual Property</h3>
            <textarea
              value={pageData.content.intellectual_property || ''}
              onChange={(e) => updateContent('intellectual_property', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>User Content</h3>
            <textarea
              value={pageData.content.user_content || ''}
              onChange={(e) => updateContent('user_content', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Third-Party Services</h3>
            <textarea
              value={pageData.content.third_party || ''}
              onChange={(e) => updateContent('third_party', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Limitation of Liability</h3>
            <textarea
              value={pageData.content.liability || ''}
              onChange={(e) => updateContent('liability', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Disclaimer of Warranties</h3>
            <textarea
              value={pageData.content.warranties || ''}
              onChange={(e) => updateContent('warranties', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Termination</h3>
            <textarea
              value={pageData.content.termination || ''}
              onChange={(e) => updateContent('termination', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Governing Law</h3>
            <textarea
              value={pageData.content.governing_law || ''}
              onChange={(e) => updateContent('governing_law', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Changes to Terms</h3>
            <textarea
              value={pageData.content.changes_terms || ''}
              onChange={(e) => updateContent('changes_terms', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Contact Us</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Contact Section Text</label>
                <textarea
                  value={pageData.content.contact_us_terms_text || ''}
                  onChange={(e) => updateContent('contact_us_terms_text', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>The contact email is set in the Terms Settings section above.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-2">How It Works</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Changes saved here are stored in the database and will appear on the live website.
          Click &quot;Save Changes&quot; when you&apos;re done editing.
        </p>
      </div>
    </div>
  )
}
