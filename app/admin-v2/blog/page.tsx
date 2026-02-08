'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAdminAuth } from '@/components/admin-v2/AdminAuthGuard'
import { getAdminSessionToken } from '@/lib/auth/admin-session-client'

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
  focus_keywords: string
  canonical_url: string
  meta_robots: string
  status: 'draft' | 'published'
  author_id: string
  published_at: string | null
  created_at: string
  updated_at: string
  word_count: number
  read_time_minutes: number
}

export default function BlogPage() {
  const { employee } = useAdminAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalTab, setModalTab] = useState<'content' | 'seo'>('content')

  // Form fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeywords, setFocusKeywords] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [metaRobots, setMetaRobots] = useState('index, follow')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Generate slug from title
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }, [])

  // Auto-generate slug when title changes (only for new posts or if slug hasn't been manually edited)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManuallyEdited, generateSlug])

  // Word count and read time
  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    if (!text) return 0
    return text.split(/\s+/).length
  }, [content])

  const readTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200))
  }, [wordCount])

  // SEO Score calculation
  const seoScore = useMemo(() => {
    let score = 0
    const suggestions: string[] = []

    // Title length 30-60 chars (+15 points)
    if (title.length >= 30 && title.length <= 60) {
      score += 15
    } else {
      suggestions.push(title.length < 30
        ? 'Title is too short. Aim for 30-60 characters.'
        : title.length > 60
          ? 'Title is too long. Keep it under 60 characters.'
          : 'Add a title between 30-60 characters.')
    }

    // Has meta description (+10)
    if (metaDescription.length > 0) {
      score += 10
    } else {
      suggestions.push('Add a meta description to improve search visibility.')
    }

    // Meta description 120-160 chars (+15)
    if (metaDescription.length >= 120 && metaDescription.length <= 160) {
      score += 15
    } else if (metaDescription.length > 0) {
      suggestions.push(metaDescription.length < 120
        ? 'Meta description is too short. Aim for 120-160 characters.'
        : 'Meta description is too long. Keep it under 160 characters.')
    }

    // Focus keywords present (+10)
    if (focusKeywords.trim().length > 0) {
      score += 10
    } else {
      suggestions.push('Add focus keywords to target specific search terms.')
    }

    // Focus keywords found in title (+10)
    if (focusKeywords.trim().length > 0 && title.length > 0) {
      const keywords = focusKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      const titleLower = title.toLowerCase()
      if (keywords.some(kw => titleLower.includes(kw))) {
        score += 10
      } else {
        suggestions.push('Include at least one focus keyword in the title.')
      }
    }

    // Focus keywords found in content (+10)
    if (focusKeywords.trim().length > 0 && content.length > 0) {
      const keywords = focusKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      const contentLower = content.toLowerCase()
      if (keywords.some(kw => contentLower.includes(kw))) {
        score += 10
      } else {
        suggestions.push('Include focus keywords in the post content.')
      }
    }

    // Content has headings (+10)
    if (content.includes('<strong>') || content.includes('<h2') || content.includes('<h3') || content.includes('##')) {
      score += 10
    } else {
      suggestions.push('Add headings (bold text or ## markers) to structure your content.')
    }

    // Content length > 300 words (+10)
    if (wordCount > 300) {
      score += 10
    } else {
      suggestions.push(`Content is ${wordCount} words. Aim for at least 300 words.`)
    }

    // Has featured image (+5)
    if (featuredImageUrl.trim().length > 0) {
      score += 5
    } else {
      suggestions.push('Add a featured image to improve engagement.')
    }

    // Slug is SEO-friendly (+5)
    if (slug.length > 0 && slug.length <= 75 && !slug.includes('--') && /^[a-z0-9-]+$/.test(slug)) {
      score += 5
    } else if (slug.length > 0) {
      suggestions.push('Make the slug shorter and URL-friendly (lowercase, hyphens only).')
    } else {
      suggestions.push('Add a URL slug for this post.')
    }

    return { score, suggestions }
  }, [title, metaDescription, focusKeywords, content, wordCount, featuredImageUrl, slug])

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const token = getAdminSessionToken()
      const response = await fetch('/api/admin/blog', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Reset form
  const resetForm = () => {
    setTitle('')
    setSlug('')
    setExcerpt('')
    setContent('')
    setCategory('')
    setTags([])
    setTagInput('')
    setFeaturedImageUrl('')
    setSeoTitle('')
    setMetaDescription('')
    setFocusKeywords('')
    setCanonicalUrl('')
    setMetaRobots('index, follow')
    setStatus('draft')
    setSlugManuallyEdited(false)
    setModalTab('content')
    setGenerateError(null)
  }

  // Open create modal
  const openCreateModal = () => {
    setEditingPost(null)
    resetForm()
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (post: BlogPost) => {
    setEditingPost(post)
    setTitle(post.title)
    setSlug(post.slug)
    setExcerpt(post.excerpt || '')
    setContent(post.content || '')
    setCategory(post.category || '')
    setTags(post.tags || [])
    setTagInput('')
    setFeaturedImageUrl(post.featured_image_url || '')
    setSeoTitle(post.seo_title || '')
    setMetaDescription(post.meta_description || '')
    setFocusKeywords(post.focus_keywords || '')
    setCanonicalUrl(post.canonical_url || '')
    setMetaRobots(post.meta_robots || 'index, follow')
    setStatus(post.status)
    setSlugManuallyEdited(true)
    setModalTab('content')
    setShowModal(true)
  }

  // Handle save
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category: category.trim(),
      tags,
      featured_image_url: featuredImageUrl.trim(),
      seo_title: seoTitle.trim(),
      meta_description: metaDescription.trim(),
      focus_keywords: focusKeywords.trim(),
      canonical_url: canonicalUrl.trim(),
      meta_robots: metaRobots,
      status,
      word_count: wordCount,
      read_time_minutes: readTime,
    }

    try {
      const token = getAdminSessionToken()
      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog'
      const method = editingPost ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (response.ok) {
        setShowModal(false)
        resetForm()
        await fetchPosts()
      }
    } catch (error) {
      console.error('Failed to save blog post:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) return

    try {
      const token = getAdminSessionToken()
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete blog post:', error)
    }
  }

  // Tag management
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Featured image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFeaturedImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Generate with AI
  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      setGenerateError('Enter a title first, then generate with AI.')
      return
    }

    setGenerating(true)
    setGenerateError(null)

    try {
      const token = getAdminSessionToken()
      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      // Populate all fields with AI-generated content
      setContent(data.content || '')
      setExcerpt(data.excerpt || '')
      setSeoTitle(data.seo_title || '')
      setMetaDescription(data.meta_description || '')
      setFocusKeywords(data.focus_keywords || '')
      if (data.category) setCategory(data.category)
      if (Array.isArray(data.tags) && data.tags.length > 0) setTags(data.tags)
    } catch (error: any) {
      console.error('AI generation failed:', error)
      setGenerateError(error.message || 'Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Content toolbar actions
  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = before + (selectedText || 'text') + after
    const newContent = content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      const newPos = start + before.length + (selectedText || 'text').length + after.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case 'link': {
        const url = prompt('Enter URL:')
        if (url) {
          const textarea = contentRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const selectedText = content.substring(start, end) || 'link text'
          const replacement = `<a href="${url}">${selectedText}</a>`
          const newContent = content.substring(0, start) + replacement + content.substring(end)
          setContent(newContent)
        }
        break
      }
      case 'bold':
        insertAtCursor('<strong>', '</strong>')
        break
      case 'italic':
        insertAtCursor('<em>', '</em>')
        break
      case 'list':
        insertAtCursor('<ul>\n  <li>', '</li>\n</ul>')
        break
      case 'image': {
        const url = prompt('Enter image URL:')
        if (url) {
          const textarea = contentRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const newContent = content.substring(0, start) + `<img src="${url}" alt="" />` + content.substring(start)
          setContent(newContent)
        }
        break
      }
      case 'chart': {
        const textarea = contentRef.current
        if (!textarea) return
        const start = textarea.selectionStart
        const newContent = content.substring(0, start) + '[Chart: description]' + content.substring(start)
        setContent(newContent)
        break
      }
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Stats
  const totalPosts = posts.length
  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length
  const totalWordCount = posts.reduce((sum, p) => sum + (p.word_count || 0), 0)

  // SEO score color
  const getScoreColor = (score: number) => {
    if (score >= 71) return '#22c55e'
    if (score >= 41) return '#f59e0b'
    return '#ef4444'
  }

  // Calculate SEO score from a saved post
  const getPostSeoScore = (post: BlogPost) => {
    let score = 0
    const t = post.title || ''
    const md = post.meta_description || ''
    const fk = post.focus_keywords || ''
    const c = post.content || ''
    const s = post.slug || ''
    const wc = post.word_count || 0

    if (t.length >= 30 && t.length <= 60) score += 15
    if (md.length > 0) score += 10
    if (md.length >= 120 && md.length <= 160) score += 15
    if (fk.trim().length > 0) score += 10
    if (fk.trim().length > 0 && t.length > 0) {
      const kws = fk.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      if (kws.some(kw => t.toLowerCase().includes(kw))) score += 10
    }
    if (fk.trim().length > 0 && c.length > 0) {
      const kws = fk.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      if (kws.some(kw => c.toLowerCase().includes(kw))) score += 10
    }
    if (c.includes('<strong>') || c.includes('<h2') || c.includes('<h3') || c.includes('##')) score += 10
    if (wc > 300) score += 10
    if ((post.featured_image_url || '').trim().length > 0) score += 5
    if (s.length > 0 && s.length <= 75 && !s.includes('--') && /^[a-z0-9-]+$/.test(s)) score += 5

    return score
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: '#22c55e' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading blog posts...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Blog Posts</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Create and manage blog content</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          + New Post
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Posts</div>
          <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{totalPosts}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>All blog posts</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Published</div>
          <div className="text-4xl font-black text-green-500">{publishedCount}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Live on site</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Drafts</div>
          <div className="text-4xl font-black text-gray-500">{draftCount}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>In progress</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Word Count</div>
          <div className="text-4xl font-black text-blue-500">{totalWordCount.toLocaleString()}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Across all posts</div>
        </div>
      </div>

      {/* Post List Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>SEO Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Word Count</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{post.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      post.status === 'published'
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {post.category || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const score = getPostSeoScore(post)
                      return (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ border: `2px solid ${getScoreColor(score)}`, color: getScoreColor(score) }}
                          >
                            {score}
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {(post.word_count || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(post)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg transition"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No blog posts yet</div>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Create your first blog post to get started</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Create Your First Post
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {editingPost ? 'Update your blog post content and settings' : 'Write and publish a new blog post'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg transition hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar */}
              <div className="w-72 shrink-0 overflow-y-auto p-6 space-y-6" style={{ borderRight: '1px solid var(--border-color)' }}>
                {/* SEO Score Card */}
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>SEO Score</div>
                  <div className="flex items-center justify-center mb-3">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                      style={{
                        border: `4px solid ${getScoreColor(seoScore.score)}`,
                        color: getScoreColor(seoScore.score),
                      }}
                    >
                      {seoScore.score}
                    </div>
                  </div>
                  <div className="text-center text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    {seoScore.score >= 71 ? 'Good' : seoScore.score >= 41 ? 'Needs Improvement' : 'Poor'} SEO
                  </div>

                  {/* AI Suggestions */}
                  {seoScore.score > 0 && seoScore.suggestions.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>AI Suggestions</div>
                      <ul className="space-y-2">
                        {seoScore.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-muted)' }}>
                            <span style={{ color: '#f59e0b' }}>&#8226;</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Post Settings Card */}
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Post Settings</div>

                  {/* Status */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Technology"
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Tags</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Type + Enter to add"
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/15 text-green-500"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-green-300 transition"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Image Card */}
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Featured Image</div>

                  {featuredImageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                      <img
                        src={featuredImageUrl}
                        alt="Featured"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <label className="block w-full px-3 py-2 rounded-lg text-sm text-center font-semibold cursor-pointer transition hover:bg-green-600 bg-green-500 text-black mb-3">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>or</div>

                  <input
                    type="text"
                    value={featuredImageUrl}
                    onChange={(e) => setFeaturedImageUrl(e.target.value)}
                    placeholder="Image URL"
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />

                  {featuredImageUrl && (
                    <button
                      onClick={() => setFeaturedImageUrl('')}
                      className="w-full mt-2 px-3 py-1 rounded-lg text-xs transition"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              {/* Right Main Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex gap-0 px-8 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {([
                    { key: 'content' as const, label: 'Content' },
                    { key: 'seo' as const, label: 'SEO' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setModalTab(tab.key)}
                      className="px-6 py-3 text-sm font-semibold transition"
                      style={{
                        color: modalTab === tab.key ? '#22c55e' : 'var(--text-muted)',
                        borderBottom: modalTab === tab.key ? '2px solid #22c55e' : '2px solid transparent',
                        marginBottom: '-1px',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  {/* Content Tab */}
                  {modalTab === 'content' && (
                    <div className="space-y-5">
                      {/* Title + Generate with AI */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Title <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateWithAI}
                            disabled={generating || !title.trim()}
                            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition disabled:opacity-40"
                            style={{
                              background: generating ? 'var(--bg-primary)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                              color: '#fff',
                              border: generating ? '1px solid var(--border-color)' : 'none',
                            }}
                          >
                            {generating ? (
                              <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate with AI
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter post title, then click Generate with AI..."
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        {generateError && (
                          <p className="text-xs mt-1.5 text-red-400">{generateError}</p>
                        )}
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Slug</label>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => {
                            setSlug(e.target.value)
                            setSlugManuallyEdited(true)
                          }}
                          placeholder="post-url-slug"
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Auto-generated from title. Edit to customize.</p>
                      </div>

                      {/* Excerpt */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Excerpt</label>
                        <textarea
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Brief summary of the post..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Content with Toolbar */}
                      <div className="relative">
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Content <span className="text-red-500">*</span>
                        </label>

                        {/* AI Generating Overlay */}
                        {generating && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.6)', top: '28px' }}>
                            <div className="text-center">
                              <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin mb-3" style={{ borderColor: 'rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6' }}></div>
                              <div className="text-sm font-semibold text-purple-400">AI is writing your blog post...</div>
                              <div className="text-xs text-gray-400 mt-1">This may take 10-20 seconds</div>
                            </div>
                          </div>
                        )}

                        {/* Toolbar */}
                        <div
                          className="flex items-center gap-1 px-3 py-2 rounded-t-lg"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderBottom: 'none' }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('link')}
                            className="px-3 py-1.5 text-xs font-semibold rounded transition bg-green-500 text-black hover:bg-green-600"
                          >
                            Add Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('bold')}
                            className="px-3 py-1.5 text-xs font-bold rounded transition hover:bg-green-500/20"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('italic')}
                            className="px-3 py-1.5 text-xs font-semibold italic rounded transition hover:bg-green-500/20"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('list')}
                            className="px-3 py-1.5 text-xs font-semibold rounded transition hover:bg-green-500/20"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            List
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('image')}
                            className="px-3 py-1.5 text-xs font-semibold rounded transition hover:bg-green-500/20"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Image
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolbarAction('chart')}
                            className="px-3 py-1.5 text-xs font-semibold rounded transition hover:bg-green-500/20"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Chart
                          </button>
                        </div>

                        <textarea
                          ref={contentRef}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Write your post content here... You can use HTML tags for formatting."
                          rows={16}
                          className="w-full px-4 py-3 rounded-b-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />

                        {/* Word count and read time */}
                        <div className="flex justify-between mt-2">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {wordCount.toLocaleString()} words
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ~{readTime} min read
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEO Tab */}
                  {modalTab === 'seo' && (
                    <div className="space-y-5">
                      {/* SEO Title */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>SEO Title</label>
                          <span className="text-xs" style={{ color: seoTitle.length > 60 ? '#ef4444' : 'var(--text-muted)' }}>
                            {seoTitle.length}/60
                          </span>
                        </div>
                        <input
                          type="text"
                          value={seoTitle}
                          onChange={(e) => setSeoTitle(e.target.value)}
                          placeholder="SEO-optimized title (defaults to post title)"
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Meta Description */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Meta Description</label>
                          <span className="text-xs" style={{ color: metaDescription.length > 160 ? '#ef4444' : 'var(--text-muted)' }}>
                            {metaDescription.length}/160
                          </span>
                        </div>
                        <textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Brief description for search engine results..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Focus Keywords */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Focus Keywords</label>
                        <input
                          type="text"
                          value={focusKeywords}
                          onChange={(e) => setFocusKeywords(e.target.value)}
                          placeholder="keyword1, keyword2, keyword3"
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Separate keywords with commas</p>
                      </div>

                      {/* Canonical URL */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Canonical URL</label>
                        <input
                          type="text"
                          value={canonicalUrl}
                          onChange={(e) => setCanonicalUrl(e.target.value)}
                          placeholder="https://example.com/original-post"
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Leave blank to use default URL</p>
                      </div>

                      {/* Meta Robots */}
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Meta Robots</label>
                        <select
                          value={metaRobots}
                          onChange={(e) => setMetaRobots(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          <option value="index, follow">index, follow</option>
                          <option value="noindex, follow">noindex, follow</option>
                          <option value="index, nofollow">index, nofollow</option>
                          <option value="noindex, nofollow">noindex, nofollow</option>
                        </select>
                      </div>

                      {/* Search Preview */}
                      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Search Preview</div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                          <div className="text-blue-400 text-base font-medium mb-1 truncate">
                            {seoTitle || title || 'Post Title'}
                          </div>
                          <div className="text-green-500 text-xs mb-1 truncate">
                            julyu.com/blog/{slug || 'post-slug'}
                          </div>
                          <div className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {metaDescription || excerpt || 'No description set. Add a meta description to control how this post appears in search results.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {editingPost ? `Last updated: ${formatDate(editingPost.updated_at)}` : 'Fill in required fields (*) to save'}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-lg font-semibold transition"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="px-6 py-3 rounded-lg font-bold text-black bg-green-500 hover:bg-green-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
