import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { createServiceRoleClient } from '@/lib/supabase/server'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  featured_image_url: string
  seo_title: string
  meta_description: string
  canonical_url: string
  meta_robots: string
  published_at: string
  read_time_minutes: number
  word_count: number
}

export const dynamic = 'force-dynamic'

// Deduplicate the Supabase query between generateMetadata and the page component
const getPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = await createServiceRoleClient() as any
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, category, tags, featured_image_url, seo_title, meta_description, canonical_url, meta_robots, published_at, read_time_minutes, word_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data as BlogPost | null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const title = post.seo_title || post.title
  const description = post.meta_description || post.excerpt || ''
  const canonical = post.canonical_url || `${baseUrl}/blog/${post.slug}`
  const robots = post.meta_robots || 'index, follow'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: 'article',
      ...(post.featured_image_url && {
        images: [{ url: post.featured_image_url, width: 1200, height: 630, alt: title }],
      }),
    },
    alternates: {
      canonical,
    },
    robots: {
      index: !robots.includes('noindex'),
      follow: !robots.includes('nofollow'),
    },
  }
}

// Convert plain text content to proper HTML paragraphs
function formatContent(content: string): string {
  // If content already has block-level HTML tags, return as-is
  if (/<(p|div|h[1-6]|ul|ol|blockquote|pre|table|section|article)\b/i.test(content)) {
    return content
  }

  // Split on double newlines to create paragraphs
  return content
    .split(/\n\s*\n/)
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      // Preserve single newlines within a block as <br>
      const withBreaks = trimmed.replace(/\n/g, '<br />')
      return `<p>${withBreaks}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const blogPost = await getPost(slug)

  if (!blogPost) {
    notFound()
  }

  const formattedContent = formatContent(blogPost.content)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blogPost.title,
    description: blogPost.excerpt || blogPost.meta_description || '',
    url: `${baseUrl}/blog/${blogPost.slug}`,
    datePublished: blogPost.published_at,
    wordCount: blogPost.word_count,
    ...(blogPost.featured_image_url && {
      image: blogPost.featured_image_url,
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Julyu',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${blogPost.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Header />
      <main className="flex-1 pt-32 pb-16 px-[5%]">
        <article className="max-w-3xl mx-auto">
          <div className="mb-10">
            <Link
              href="/blog"
              className="text-sm text-green-500 hover:text-green-400 transition mb-6 inline-block"
            >
              &larr; Back to Blog
            </Link>

            {blogPost.category && (
              <span className="text-xs font-semibold uppercase text-green-500 mb-3 block">
                {blogPost.category}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight text-white">
              {blogPost.title}
            </h1>

            <div className="flex items-center gap-3 text-sm mb-6 text-gray-500">
              <span>
                {new Date(blogPost.published_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>&middot;</span>
              <span>{blogPost.read_time_minutes} min read</span>
              <span>&middot;</span>
              <span>{blogPost.word_count.toLocaleString()} words</span>
            </div>
          </div>

          {blogPost.featured_image_url && (
            <div className="rounded-2xl overflow-hidden mb-10 relative aspect-[2/1]" style={{ maxHeight: '500px' }}>
              <Image
                src={blogPost.featured_image_url}
                alt={blogPost.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-contain"
              />
            </div>
          )}

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {blogPost.tags && blogPost.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t border-gray-800">
              <div className="flex flex-wrap gap-2">
                {blogPost.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full bg-gray-900 text-gray-500 border border-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
