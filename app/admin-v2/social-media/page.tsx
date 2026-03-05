'use client'

import { useEffect, useState } from 'react'
import {
  PLATFORM_CHAR_LIMITS,
  PLATFORM_LABELS,
  type Platform,
  type PostStatus,
  type Tone,
  type SocialMediaPost,
  type AutomationConfig,
} from '@/lib/social/types'

type Tab = 'generator' | 'queue' | 'published' | 'automation' | 'connections'

const ALL_PLATFORMS: Platform[] = ['TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK']
const TONES: { value: Tone; label: string }[] = [
  { value: 'informative', label: 'Informative' },
  { value: 'engaging', label: 'Engaging' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'controversial', label: 'Controversial' },
]

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function statusBadge(status: PostStatus) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-amber-500/15 text-amber-500',
    SCHEDULED: 'bg-blue-500/15 text-blue-500',
    PUBLISHED: 'bg-green-500/15 text-green-500',
    FAILED: 'bg-red-500/15 text-red-500',
    CANCELLED: 'bg-gray-500/15 text-gray-500',
  }
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${colors[status] || ''}`}>
      {status}
    </span>
  )
}

function charCountColor(len: number, limit: number): string {
  const ratio = len / limit
  if (ratio > 1) return 'text-red-500'
  if (ratio > 0.9) return 'text-amber-500'
  return 'text-green-500'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SocialMediaPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('generator')
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [stats, setStats] = useState({ drafts: 0, scheduled: 0, published: 0, failed: 0, total: 0, byPlatform: {} as Record<string, number> })

  // Generator state
  const [genTopic, setGenTopic] = useState('')
  const [genTone, setGenTone] = useState<Tone>('engaging')
  const [genPlatforms, setGenPlatforms] = useState<Platform[]>(['TWITTER', 'LINKEDIN'])
  const [generating, setGenerating] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<SocialMediaPost[]>([])
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Queue filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL')
  const [publishedFilterPlatform, setPublishedFilterPlatform] = useState<string>('ALL')

  // Automation
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    enabled: false, platforms: [], hour: 9, topics: [], use_domain_content: false, require_approval: true,
  })
  const [automationTopicInput, setAutomationTopicInput] = useState('')
  const [automationSaving, setAutomationSaving] = useState(false)

  // Connections
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({})
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({
    TWITTER: { api_key: '', api_secret: '', access_token: '', access_token_secret: '' },
    LINKEDIN: { access_token: '', person_urn: '' },
    FACEBOOK: { page_access_token: '', page_id: '' },
  })
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [savingCreds, setSavingCreds] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionResult, setConnectionResult] = useState<Record<string, { success: boolean; message: string }>>({})

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    if (activeTab === 'automation') loadAutomation()
    if (activeTab === 'connections') loadConnectionStatus()
  }, [activeTab])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPosts = async (status?: string, platform?: string) => {
    try {
      const params = new URLSearchParams()
      if (status && status !== 'ALL') params.set('status', status)
      if (platform && platform !== 'ALL') params.set('platform', platform)
      const res = await fetch(`/api/admin/social-posts?${params}`, { headers: JSON_HEADERS })
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts || [])
        setStats(data.stats || { drafts: 0, scheduled: 0, published: 0, failed: 0, total: 0, byPlatform: {} })
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAutomation = async () => {
    try {
      const res = await fetch('/api/admin/social-posts/automation', { headers: JSON_HEADERS })
      const data = await res.json()
      if (res.ok && data.config) {
        setAutomationConfig(data.config)
      }
    } catch (error) {
      console.error('Error loading automation config:', error)
    }
  }

  const loadConnectionStatus = async () => {
    try {
      const res = await fetch('/api/admin/social-posts/credentials', { headers: JSON_HEADERS })
      const data = await res.json()
      if (res.ok && data.status) {
        setConnectionStatus(data.status)
      }
    } catch (error) {
      console.error('Error loading connection status:', error)
    }
  }

  // --- Generator ---

  const handleGenerate = async () => {
    if (!genTopic.trim()) return showToast('Please enter a topic', 'error')
    if (genPlatforms.length === 0) return showToast('Select at least one platform', 'error')

    setGenerating(true)
    setGeneratedPosts([])
    setEditedContent({})
    try {
      const res = await fetch('/api/admin/social-posts/bulk-generate', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ topic: genTopic, tone: genTone, platforms: genPlatforms }),
      })
      const data = await res.json()
      if (res.ok && data.generated) {
        const newPosts = data.generated.map((g: any) => g.post)
        setGeneratedPosts(newPosts)
        const contentMap: Record<string, string> = {}
        newPosts.forEach((p: SocialMediaPost) => { contentMap[p.id] = p.content })
        setEditedContent(contentMap)
        if (data.totalGenerated > 0) {
          showToast(`Generated ${data.totalGenerated} post(s)${data.totalErrors > 0 ? ` (${data.totalErrors} failed)` : ''}`)
        } else if (data.errors?.length > 0) {
          showToast(data.errors[0].error || 'All generations failed', 'error')
        }
        loadPosts()
      } else {
        showToast(data.error || 'Generation failed', 'error')
      }
    } catch (error) {
      showToast('Generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprovePost = async (post: SocialMediaPost) => {
    // Schedule for 9AM UTC next day
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(9, 0, 0, 0)

    try {
      const content = editedContent[post.id] || post.content
      const res = await fetch(`/api/admin/social-posts/${post.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ content, status: 'SCHEDULED', scheduled_at: tomorrow.toISOString() }),
      })
      if (res.ok) {
        setGeneratedPosts((prev) => prev.filter((p) => p.id !== post.id))
        showToast(`Scheduled for ${formatDate(tomorrow.toISOString())}`)
        loadPosts()
      }
    } catch {
      showToast('Failed to approve post', 'error')
    }
  }

  const handleDiscardPost = async (postId: string) => {
    try {
      await fetch(`/api/admin/social-posts/${postId}`, { method: 'DELETE', headers: JSON_HEADERS })
      setGeneratedPosts((prev) => prev.filter((p) => p.id !== postId))
      loadPosts()
    } catch {
      showToast('Failed to discard', 'error')
    }
  }

  const handleCopy = (postId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(postId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- Queue ---

  const filteredQueuePosts = posts.filter((p) => {
    if (p.status === 'PUBLISHED') return false
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false
    if (filterPlatform !== 'ALL' && p.platform !== filterPlatform) return false
    return true
  })

  const filteredPublishedPosts = posts.filter((p) => {
    if (p.status !== 'PUBLISHED') return false
    if (publishedFilterPlatform !== 'ALL' && p.platform !== publishedFilterPlatform) return false
    return true
  })

  const handlePublishNow = async (postId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/social-posts/${postId}/publish`, {
        method: 'POST',
        headers: JSON_HEADERS,
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Published successfully!')
        loadPosts()
      } else {
        showToast(data.error || 'Publish failed', 'error')
      }
    } catch {
      showToast('Publish failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`/api/admin/social-posts/${postId}`, { method: 'DELETE', headers: JSON_HEADERS })
      showToast('Post deleted')
      loadPosts()
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleBulkApprove = async () => {
    const drafts = posts.filter((p) => p.status === 'DRAFT')
    if (drafts.length === 0) return showToast('No drafts to approve', 'error')

    setActionLoading(true)
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(9, 0, 0, 0)

    try {
      await Promise.all(
        drafts.map((p) =>
          fetch(`/api/admin/social-posts/${p.id}`, {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify({ status: 'SCHEDULED', scheduled_at: tomorrow.toISOString() }),
          })
        )
      )
      showToast(`Scheduled ${drafts.length} post(s) for tomorrow 9AM UTC`)
      loadPosts()
    } catch {
      showToast('Bulk approve failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // --- Automation ---

  const handleSaveAutomation = async () => {
    setAutomationSaving(true)
    try {
      const res = await fetch('/api/admin/social-posts/automation', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(automationConfig),
      })
      if (res.ok) showToast('Automation config saved')
      else showToast('Failed to save', 'error')
    } catch {
      showToast('Failed to save', 'error')
    } finally {
      setAutomationSaving(false)
    }
  }

  // --- Connections ---

  const handleSaveCredentials = async (platform: string) => {
    setSavingCreds(platform)
    try {
      const res = await fetch('/api/admin/social-posts/credentials', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ platform, credentials: credentials[platform] }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`${PLATFORM_LABELS[platform as Platform]} credentials saved`)
        setConnectionStatus((prev) => ({ ...prev, [platform]: true }))
      } else {
        showToast(data.error || 'Failed to save', 'error')
      }
    } catch {
      showToast('Failed to save credentials', 'error')
    } finally {
      setSavingCreds(null)
    }
  }

  const handleTestConnection = async (platform: string) => {
    setTestingConnection(platform)
    setConnectionResult((prev) => ({ ...prev, [platform]: undefined as any }))
    try {
      const res = await fetch('/api/admin/social-posts/test-connection', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ platform }),
      })
      const data = await res.json()
      setConnectionResult((prev) => ({
        ...prev,
        [platform]: {
          success: data.success,
          message: data.success ? `Connected as ${data.username}` : data.error || 'Connection failed',
        },
      }))
    } catch {
      setConnectionResult((prev) => ({
        ...prev,
        [platform]: { success: false, message: 'Connection test failed' },
      }))
    } finally {
      setTestingConnection(null)
    }
  }

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading social media...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444', color: '#000' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Social Media</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Generate, manage, and publish social media posts with AI</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Drafts</div>
          <div className="text-4xl font-black text-amber-500">{stats.drafts}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Awaiting review</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Scheduled</div>
          <div className="text-4xl font-black text-blue-500">{stats.scheduled}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Queued for publishing</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Published</div>
          <div className="text-4xl font-black text-green-500">{stats.published}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Live on platforms</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Failed</div>
          <div className="text-4xl font-black text-red-500">{stats.failed}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Publishing errors</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {([
          { key: 'generator' as Tab, label: 'Generator' },
          { key: 'queue' as Tab, label: 'Queue' },
          { key: 'published' as Tab, label: 'Published' },
          { key: 'automation' as Tab, label: 'Automation' },
          { key: 'connections' as Tab, label: 'Connections' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-6 py-3 text-sm font-semibold transition"
            style={{
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Generator */}
      {activeTab === 'generator' && (
        <div>
          <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Generate Posts with AI</h3>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Topic / Theme</label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g., Back to school grocery savings tips"
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Tone */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Tone</label>
              <select
                value={genTone}
                onChange={(e) => setGenTone(e.target.value as Tone)}
                className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Platforms */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Platforms</label>
              <div className="flex flex-wrap gap-3">
                {ALL_PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setGenPlatforms((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      )
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                    style={{
                      backgroundColor: genPlatforms.includes(p) ? '#22c55e' : 'var(--bg-primary)',
                      color: genPlatforms.includes(p) ? '#000' : 'var(--text-secondary)',
                      border: `1px solid ${genPlatforms.includes(p) ? '#22c55e' : 'var(--border-color)'}`,
                    }}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 rounded-lg font-bold text-sm transition"
              style={{
                backgroundColor: generating ? 'var(--border-color)' : '#22c55e',
                color: '#000',
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? 'Generating...' : 'Generate All'}
            </button>
          </div>

          {/* Generated Posts */}
          {generatedPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Generated Posts</h3>
              {generatedPosts.map((post) => {
                const content = editedContent[post.id] || post.content
                const limit = PLATFORM_CHAR_LIMITS[post.platform]
                return (
                  <div key={post.id} className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                      <span className={`text-xs font-semibold ${charCountColor(content.length, limit)}`}>
                        {content.length} / {limit}
                      </span>
                    </div>

                    <textarea
                      value={content}
                      onChange={(e) => setEditedContent((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical mb-3"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />

                    {/* Collapsible hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mb-2">
                        <button
                          onClick={() => setExpandedSections((prev) => ({ ...prev, [`${post.id}-tags`]: !prev[`${post.id}-tags`] }))}
                          className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}
                        >
                          {expandedSections[`${post.id}-tags`] ? '- Hide' : '+'} Hashtags ({post.hashtags.length})
                        </button>
                        {expandedSections[`${post.id}-tags`] && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {post.hashtags.map((h, i) => (
                              <span key={i} className="px-2 py-1 text-xs rounded-lg bg-green-500/15 text-green-500">#{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsible image prompt */}
                    {post.image_prompt && (
                      <div className="mb-3">
                        <button
                          onClick={() => setExpandedSections((prev) => ({ ...prev, [`${post.id}-img`]: !prev[`${post.id}-img`] }))}
                          className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}
                        >
                          {expandedSections[`${post.id}-img`] ? '- Hide' : '+'} Image Prompt
                        </button>
                        {expandedSections[`${post.id}-img`] && (
                          <p className="text-xs mt-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                            {post.image_prompt}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(post.id, content)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        {copiedId === post.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleApprovePost(post)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition"
                        style={{ backgroundColor: '#22c55e', color: '#000' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDiscardPost(post.id)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #ef4444', color: '#ef4444' }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Queue */}
      {activeTab === 'queue' && (
        <div>
          {/* Filters + Bulk */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Platforms</option>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-bold transition ml-auto"
              style={{ backgroundColor: '#22c55e', color: '#000', opacity: actionLoading ? 0.6 : 1 }}
            >
              Approve All Drafts ({stats.drafts})
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Platform</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Content</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Scheduled</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueuePosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No posts in queue
                      </td>
                    </tr>
                  ) : (
                    filteredQueuePosts.map((post) => (
                      <tr key={post.id} className="hover:bg-white/5 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {PLATFORM_LABELS[post.platform]}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-[300px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {post.content.substring(0, 80)}{post.content.length > 80 ? '...' : ''}
                        </td>
                        <td className="px-6 py-4">{statusBadge(post.status)}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(post.scheduled_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePublishNow(post.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 rounded-lg text-xs font-bold transition"
                              style={{ backgroundColor: '#22c55e', color: '#000' }}
                            >
                              Publish
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition"
                              style={{ border: '1px solid #ef4444', color: '#ef4444' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Published */}
      {activeTab === 'published' && (
        <div>
          {/* Per-platform stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            {ALL_PLATFORMS.map((p) => (
              <div key={p} className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{PLATFORM_LABELS[p]}</div>
                <div className="text-xl font-black text-green-500">{stats.byPlatform[p] || 0}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="mb-6">
            <select
              value={publishedFilterPlatform}
              onChange={(e) => setPublishedFilterPlatform(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">All Platforms</option>
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Platform</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Content</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPublishedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No published posts
                      </td>
                    </tr>
                  ) : (
                    filteredPublishedPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-white/5 transition" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {PLATFORM_LABELS[post.platform]}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-[400px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(post.published_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automation */}
      {activeTab === 'automation' && (
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Automation Settings</h3>

          {/* Enable toggle */}
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Enable Daily Auto-Generation</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Automatically generate posts at the configured time</div>
            </div>
            <button
              onClick={() => setAutomationConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className="w-12 h-6 rounded-full transition relative"
              style={{ backgroundColor: automationConfig.enabled ? '#22c55e' : 'var(--border-color)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: automationConfig.enabled ? '26px' : '2px' }}
              />
            </button>
          </div>

          {/* Platforms */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Platforms</label>
            <div className="flex flex-wrap gap-3">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setAutomationConfig((prev) => ({
                      ...prev,
                      platforms: prev.platforms.includes(p) ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
                    }))
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                  style={{
                    backgroundColor: automationConfig.platforms.includes(p) ? '#22c55e' : 'var(--bg-primary)',
                    color: automationConfig.platforms.includes(p) ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${automationConfig.platforms.includes(p) ? '#22c55e' : 'var(--border-color)'}`,
                  }}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Hour slider */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Generation Hour (UTC): <span className="text-green-500">{automationConfig.hour}:00</span>
            </label>
            <input
              type="range"
              min={0}
              max={23}
              value={automationConfig.hour}
              onChange={(e) => setAutomationConfig((prev) => ({ ...prev, hour: parseInt(e.target.value) }))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>00:00</span><span>12:00</span><span>23:00</span>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Topic Rotation Pool</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={automationTopicInput}
                onChange={(e) => setAutomationTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && automationTopicInput.trim()) {
                    setAutomationConfig((prev) => ({ ...prev, topics: [...prev.topics, automationTopicInput.trim()] }))
                    setAutomationTopicInput('')
                  }
                }}
                placeholder="Add a topic and press Enter"
                className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => {
                  if (automationTopicInput.trim()) {
                    setAutomationConfig((prev) => ({ ...prev, topics: [...prev.topics, automationTopicInput.trim()] }))
                    setAutomationTopicInput('')
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: '#22c55e', color: '#000' }}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {automationConfig.topics.map((topic, i) => (
                <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  {topic}
                  <button
                    onClick={() => setAutomationConfig((prev) => ({ ...prev, topics: prev.topics.filter((_, j) => j !== i) }))}
                    className="text-red-400 hover:text-red-300"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between mb-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Use Domain Content</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use recent blog posts as generation themes</div>
            </div>
            <button
              onClick={() => setAutomationConfig((prev) => ({ ...prev, use_domain_content: !prev.use_domain_content }))}
              className="w-12 h-6 rounded-full transition relative"
              style={{ backgroundColor: automationConfig.use_domain_content ? '#22c55e' : 'var(--border-color)' }}
            >
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: automationConfig.use_domain_content ? '26px' : '2px' }} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-6 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Require Approval</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Posts land as drafts instead of auto-scheduling</div>
            </div>
            <button
              onClick={() => setAutomationConfig((prev) => ({ ...prev, require_approval: !prev.require_approval }))}
              className="w-12 h-6 rounded-full transition relative"
              style={{ backgroundColor: automationConfig.require_approval ? '#22c55e' : 'var(--border-color)' }}
            >
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: automationConfig.require_approval ? '26px' : '2px' }} />
            </button>
          </div>

          <button
            onClick={handleSaveAutomation}
            disabled={automationSaving}
            className="px-6 py-3 rounded-lg font-bold text-sm transition"
            style={{ backgroundColor: '#22c55e', color: '#000', opacity: automationSaving ? 0.6 : 1 }}
          >
            {automationSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}

      {/* Tab: Connections */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Twitter */}
          <ConnectionCard
            platform="TWITTER"
            label={PLATFORM_LABELS.TWITTER}
            connected={connectionStatus.TWITTER}
            fields={[
              { key: 'api_key', label: 'API Key' },
              { key: 'api_secret', label: 'API Secret' },
              { key: 'access_token', label: 'Access Token' },
              { key: 'access_token_secret', label: 'Access Token Secret' },
            ]}
            credentials={credentials.TWITTER}
            onCredChange={(key, val) => setCredentials((prev) => ({ ...prev, TWITTER: { ...prev.TWITTER, [key]: val } }))}
            showPasswords={showPasswords}
            onToggleShow={(key) => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
            saving={savingCreds === 'TWITTER'}
            onSave={() => handleSaveCredentials('TWITTER')}
            testing={testingConnection === 'TWITTER'}
            onTest={() => handleTestConnection('TWITTER')}
            testResult={connectionResult.TWITTER}
            guide="Get credentials at developer.twitter.com. Create a project and app, then generate OAuth 1.0a keys."
          />

          {/* LinkedIn */}
          <ConnectionCard
            platform="LINKEDIN"
            label={PLATFORM_LABELS.LINKEDIN}
            connected={connectionStatus.LINKEDIN}
            fields={[
              { key: 'access_token', label: 'Access Token' },
              { key: 'person_urn', label: 'Person URN (e.g., urn:li:person:...)' },
            ]}
            credentials={credentials.LINKEDIN}
            onCredChange={(key, val) => setCredentials((prev) => ({ ...prev, LINKEDIN: { ...prev.LINKEDIN, [key]: val } }))}
            showPasswords={showPasswords}
            onToggleShow={(key) => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
            saving={savingCreds === 'LINKEDIN'}
            onSave={() => handleSaveCredentials('LINKEDIN')}
            testing={testingConnection === 'LINKEDIN'}
            onTest={() => handleTestConnection('LINKEDIN')}
            testResult={connectionResult.LINKEDIN}
            guide="Get credentials at linkedin.com/developers. Create an app with 'Share on LinkedIn' product."
          />

          {/* Facebook */}
          <ConnectionCard
            platform="FACEBOOK"
            label={PLATFORM_LABELS.FACEBOOK}
            connected={connectionStatus.FACEBOOK}
            fields={[
              { key: 'page_access_token', label: 'Page Access Token' },
              { key: 'page_id', label: 'Page ID' },
            ]}
            credentials={credentials.FACEBOOK}
            onCredChange={(key, val) => setCredentials((prev) => ({ ...prev, FACEBOOK: { ...prev.FACEBOOK, [key]: val } }))}
            showPasswords={showPasswords}
            onToggleShow={(key) => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
            saving={savingCreds === 'FACEBOOK'}
            onSave={() => handleSaveCredentials('FACEBOOK')}
            testing={testingConnection === 'FACEBOOK'}
            onTest={() => handleTestConnection('FACEBOOK')}
            testResult={connectionResult.FACEBOOK}
            guide="Get credentials at developers.facebook.com. Create an app and generate a Page Access Token."
          />

          {/* Instagram - not supported */}
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{PLATFORM_LABELS.INSTAGRAM}</span>
                <span className="ml-3 px-2 py-1 text-xs rounded-lg bg-gray-500/15 text-gray-400">Not Supported</span>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Instagram does not support text-only posts via API. Image/video posts require the Content Publishing API.
            </p>
          </div>

          {/* TikTok - coming soon */}
          <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{PLATFORM_LABELS.TIKTOK}</span>
                <span className="ml-3 px-2 py-1 text-xs rounded-lg bg-blue-500/15 text-blue-400">Coming Soon</span>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              TikTok Content Posting API integration is planned for a future update.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Connection Card Component ---

function ConnectionCard({
  platform,
  label,
  connected,
  fields,
  credentials,
  onCredChange,
  showPasswords,
  onToggleShow,
  saving,
  onSave,
  testing,
  onTest,
  testResult,
  guide,
}: {
  platform: string
  label: string
  connected: boolean
  fields: { key: string; label: string }[]
  credentials: Record<string, string>
  onCredChange: (key: string, val: string) => void
  showPasswords: Record<string, boolean>
  onToggleShow: (key: string) => void
  saving: boolean
  onSave: () => void
  testing: boolean
  onTest: () => void
  testResult?: { success: boolean; message: string }
  guide: string
}) {
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-xs" style={{ color: connected ? '#22c55e' : 'var(--text-muted)' }}>
            {connected ? 'Configured' : 'Not configured'}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {fields.map((field) => {
          const fieldKey = `${platform}-${field.key}`
          return (
            <div key={field.key}>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
              <div className="flex gap-2">
                <input
                  type={showPasswords[fieldKey] ? 'text' : 'password'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => onCredChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={() => onToggleShow(fieldKey)}
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                >
                  {showPasswords[fieldKey] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Guide */}
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{guide}</p>

      {/* Test result */}
      {testResult && (
        <div className={`px-4 py-2 rounded-lg text-xs font-semibold mb-4 ${testResult.success ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-bold transition"
          style={{ backgroundColor: '#22c55e', color: '#000', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Credentials'}
        </button>
        <button
          onClick={onTest}
          disabled={testing}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', opacity: testing ? 0.6 : 1 }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  )
}
