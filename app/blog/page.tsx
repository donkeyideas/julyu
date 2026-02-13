import type { Metadata } from 'next'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import BlogContent from '@/components/blog/BlogContent'
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

// Fetch page 1 posts + total count with 2 parallel queries (faster than count: 'exact')
const getFirstPagePosts = unstable_cache(
  async () => {
    const supabase = createServiceRoleClient() as any

    const [postsResult, countResult] = await Promise.all([
      supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, category, featured_image_url, published_at, read_time_minutes')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(0, POSTS_PER_PAGE - 1),
      supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
    ])

    return {
      totalPosts: countResult.count || 0,
      posts: (postsResult.data || []) as BlogPost[],
    }
  },
  ['blog-first-page'],
  { revalidate: 3600 }
)

// Page is static/ISR — no searchParams access, cached for 1 hour
export const revalidate = 3600

export default async function BlogPage() {
  const { totalPosts, posts } = await getFirstPagePosts()
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE))

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

          <BlogContent initialPosts={posts} totalPages={totalPages} />

        </div>
      </main>
      <Footer />
    </div>
  )
}
