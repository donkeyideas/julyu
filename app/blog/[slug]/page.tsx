import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServiceRoleClient() as any

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, seo_title, meta_description, excerpt, featured_image_url, canonical_url, meta_robots, slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServiceRoleClient() as any

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  const blogPost = post as BlogPost

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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Header />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <Link
              href="/blog"
              className="text-sm text-green-500 hover:text-green-400 transition mb-4 inline-block"
            >
              &larr; Back to Blog
            </Link>

            {blogPost.category && (
              <span className="text-xs font-semibold uppercase text-green-500 mb-3 block">
                {blogPost.category}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>
              {blogPost.title}
            </h1>

            <div className="flex items-center gap-3 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
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
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={blogPost.featured_image_url}
                alt={blogPost.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none"
            style={{ color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />

          {blogPost.tags && blogPost.tags.length > 0 && (
            <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex flex-wrap gap-2">
                {blogPost.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
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
    </>
  )
}
