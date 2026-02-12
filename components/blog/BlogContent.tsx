'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

function BlogGrid({ initialPosts, totalPages }: { initialPosts: BlogPost[]; totalPages: number }) {
  const searchParams = useSearchParams()
  const pageParam = searchParams.get('page')
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const safePage = Math.min(currentPage, totalPages)

  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentPage <= 1) {
      setPosts(initialPosts)
      return
    }
    setLoading(true)
    fetch(`/api/blog/posts?page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentPage, initialPosts])

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500">No blog posts yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg text-gray-500">Loading posts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
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
                  <p className="text-sm mb-4 line-clamp-3 text-gray-500">{post.excerpt}</p>
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
  )
}

export default function BlogContent({
  initialPosts,
  totalPages,
}: {
  initialPosts: BlogPost[]
  totalPages: number
}) {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg text-gray-500">Loading posts...</p>
        </div>
      }
    >
      <BlogGrid initialPosts={initialPosts} totalPages={totalPages} />
    </Suspense>
  )
}
