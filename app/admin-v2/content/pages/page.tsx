'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Page {
  id: string
  page_slug: string
  title: string
  meta_description: string
  is_published: boolean
  updated_at: string
}

export default function ContentPagesPage() {
  const [pages] = useState<Page[]>([
    {
      id: '1',
      page_slug: 'home',
      title: 'Home Page',
      meta_description: 'AI-powered grocery price comparison across 50+ retailers.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      page_slug: 'features',
      title: 'Features',
      meta_description: 'Explore all features of Julyu grocery price comparison.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      page_slug: 'pricing',
      title: 'Pricing',
      meta_description: 'Simple, transparent pricing for Julyu.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      page_slug: 'about',
      title: 'About Us',
      meta_description: 'Learn about the team behind Julyu.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      page_slug: 'contact',
      title: 'Contact',
      meta_description: 'Get in touch with the Julyu team.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      page_slug: 'privacy',
      title: 'Privacy Policy',
      meta_description: 'How Julyu collects, uses, and protects your personal information.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: '7',
      page_slug: 'terms',
      title: 'Terms of Service',
      meta_description: 'Terms and conditions for using Julyu services.',
      is_published: true,
      updated_at: new Date().toISOString(),
    },
  ])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>All Pages</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage content and SEO for all site pages</p>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <div key={page.id} className="rounded-xl p-6 hover:border-green-500/50 transition" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{page.title}</h3>
              {page.is_published ? (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Published</span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Draft</span>
              )}
            </div>
            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{page.meta_description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/{page.page_slug}</span>
              <div className="flex gap-2">
                <a
                  href={`/${page.page_slug === 'home' ? '' : page.page_slug}`}
                  target="_blank"
                  className="px-3 py-1 rounded text-sm hover:opacity-80 transition"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  View
                </a>
                {page.page_slug === 'home' ? (
                  <Link
                    href="/admin-v2/content/home-editor"
                    className="px-3 py-1 bg-green-500 text-black rounded text-sm font-medium hover:bg-green-600 transition"
                  >
                    Edit
                  </Link>
                ) : (
                  <Link
                    href={`/admin-v2/content/pages/${page.page_slug}`}
                    className="px-3 py-1 bg-green-500 text-black rounded text-sm font-medium hover:bg-green-600 transition"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-2">Content Management Active</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Click &quot;Edit&quot; on any page to modify its content, headlines, and SEO settings.
          Changes will be reflected on the live site after saving.
        </p>
      </div>
    </div>
  )
}
