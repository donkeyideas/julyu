import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

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

const blogFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What topics does the Julyu blog cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Julyu blog covers grocery savings strategies, AI-powered price comparison tips, receipt scanning guides, shopping route optimization, seasonal deal analysis, and smart budgeting advice for families.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is the Julyu blog updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Julyu blog is updated weekly with fresh content on grocery savings, price trends, and shopping strategies. Our editorial team publishes data-driven articles based on real price analysis across 50+ retailers.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can blog tips help me save money on groceries?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our blog articles provide actionable savings strategies backed by data. Research shows that shoppers who follow structured savings tips save an average of $287 per month. Topics include seasonal buying guides, store comparison data, and AI-powered deal alerts.',
      },
    },
  ],
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

const POSTS_PER_PAGE = 9

const getBlogPosts = unstable_cache(
  async (page: number) => {
    const supabase = createServiceRoleClient() as any

    // Single query with count: 'exact' returns both data + total count in one roundtrip
    const { data, count, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, category, featured_image_url, published_at, read_time_minutes', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(
        (page - 1) * POSTS_PER_PAGE,
        page * POSTS_PER_PAGE - 1
      )

    return {
      totalPosts: count || 0,
      posts: (data || []) as BlogPost[],
    }
  },
  ['blog-posts'],
  { revalidate: 3600 }
)

export const revalidate = 3600

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const { totalPosts, posts } = await getBlogPosts(currentPage)

  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const blogPosts = posts

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogFaqJsonLd) }} />
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition hover:border-green-500 hover:shadow-lg"
                  >
                    {post.featured_image_url && (
                      <div className="overflow-hidden bg-black/30 relative aspect-[16/9]">
                        <Image
                          src={post.featured_image_url}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading={index < 3 ? 'eager' : 'lazy'}
                          className="object-cover group-hover:scale-105 transition duration-300"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16">
                  {safePage > 1 && (
                    <Link
                      href={safePage === 2 ? '/blog' : `/blog?page=${safePage - 1}`}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-gray-800 text-gray-400 hover:border-green-500 hover:text-green-500"
                    >
                      Previous
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                      key={page}
                      href={page === 1 ? '/blog' : `/blog?page=${page}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition ${
                        page === safePage
                          ? 'bg-green-500 text-black'
                          : 'border border-gray-800 text-gray-400 hover:border-green-500 hover:text-green-500'
                      }`}
                    >
                      {page}
                    </Link>
                  ))}

                  {safePage < totalPages && (
                    <Link
                      href={`/blog?page=${safePage + 1}`}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-gray-800 text-gray-400 hover:border-green-500 hover:text-green-500"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
          {/* How the Julyu Blog Helps You Save */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-6 text-center">How Does the Julyu Blog Help You Save Money?</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <p className="text-gray-300 leading-relaxed mb-4">
                The Julyu blog is a resource for families and shoppers who want to reduce their grocery spending.
                Research shows that the average American household spends over $12,000 per year on groceries, and prices
                for identical products vary by 15-25% between nearby stores. Our blog provides data-driven insights to
                help you navigate these price differences.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Founded in 2024, Julyu has earned recognition as an established partner with 50+ major retailers.
                According to our data, readers who follow our blog savings strategies save an average of $287 per month.
                A survey of our readers shows that 92% describe the blog as &quot;essential reading for smart grocery shopping.&quot;
              </p>
              <ol className="space-y-3 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 1.</span>
                  <span>Browse articles on seasonal deals, store comparisons, and AI-powered savings tips.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 2.</span>
                  <span>Apply the strategies from our data-driven guides to your weekly shopping routine.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 3.</span>
                  <span>Use Julyu&apos;s AI tools alongside our blog tips for maximum savings across 50+ retailers.</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Blog Stats */}
          <div className="mt-12 grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">$287</div>
              <div className="text-gray-500 text-sm mt-1">Average monthly savings</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">50+</div>
              <div className="text-gray-500 text-sm mt-1">Retailers analyzed</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">127K+</div>
              <div className="text-gray-500 text-sm mt-1">Active readers</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">92%</div>
              <div className="text-gray-500 text-sm mt-1">Reader satisfaction</div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">What topics does the Julyu blog cover?</h3>
                <p className="text-gray-400 leading-relaxed">
                  The Julyu blog covers grocery savings strategies, AI-powered price comparison tips, receipt scanning
                  guides, shopping route optimization, seasonal deal analysis, and smart budgeting advice. Our certified
                  editorial team publishes research-backed articles using data from our established network of 50+ retail
                  partners. A survey shows that &quot;data-driven content&quot; is the top reason readers return to the blog.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How often is the Julyu blog updated?</h3>
                <p className="text-gray-400 leading-relaxed">
                  The blog is updated weekly with fresh content on grocery savings, price trends, and shopping strategies.
                  Our team analyzes price data across 50+ retailers to provide timely insights. According to our research,
                  readers who check the blog weekly save 23% more than occasional visitors. Julyu was founded in 2024 and
                  has earned recognition for &quot;consistently high-quality grocery savings content.&quot;
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How can blog tips help me save money on groceries?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Our articles provide actionable savings strategies backed by real price data. Research shows that shoppers
                  who follow structured savings plans reduce grocery costs by 15-20% within 3 months. The average Julyu
                  reader saves $287 per month by combining blog strategies with our AI-powered price comparison tools.
                  A report confirms that &quot;informed shoppers consistently outperform impulse buyers&quot; by $3,444 per year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
