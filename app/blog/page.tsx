import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { createServiceRoleClient } from '@/lib/supabase/server'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Blog - Grocery Savings Tips & Insights',
  description:
    'Read the latest tips on saving money on groceries, AI-powered price comparison insights, and smart shopping strategies from the Julyu team.',
  openGraph: {
    title: 'Julyu Blog - Grocery Savings Tips & Insights',
    description:
      'Expert tips on saving money on groceries with AI-powered price comparison.',
    url: `${baseUrl}/blog`,
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
}

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Julyu Blog',
  description: 'Grocery savings tips, price comparison insights, and smart shopping strategies.',
  url: `${baseUrl}/blog`,
  publisher: {
    '@type': 'Organization',
    name: 'Julyu',
    url: baseUrl,
  },
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  featured_image_url: string
  published_at: string
  read_time_minutes: number
}

export const revalidate = 60

export default async function BlogPage() {
  const supabase = await createServiceRoleClient() as any

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, featured_image_url, published_at, read_time_minutes')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const blogPosts: BlogPost[] = posts || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <Header />
      <main className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Julyu <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Blog</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Tips, insights, and strategies to save money on groceries with AI-powered price comparison.
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-gray-500">
                No blog posts yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition hover:border-green-500 hover:shadow-lg"
                >
                  {post.featured_image_url && (
                    <div className="overflow-hidden bg-black/30">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-auto group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <span className="text-xs font-semibold uppercase text-green-500 mb-2 block">
                        {post.category}
                      </span>
                    )}
                    <h2 className="text-xl font-bold mb-2 text-white group-hover:text-green-500 transition">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm mb-4 line-clamp-3 text-gray-500">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>&middot;</span>
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
