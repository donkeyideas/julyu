'use client'

import { useState, useEffect, useCallback } from 'react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  read_by: string | null
  read_at: string | null
  created_at: string
}

interface Stats {
  total: number
  unread: number
  read: number
}

export default function InboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, read: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const limit = 20

  const loadMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        filter: activeTab,
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/inbox?${params}`)
      const data = await res.json()

      if (res.ok) {
        setMessages(data.messages)
        setStats(data.stats)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, search])

  useEffect(() => {
    setLoading(true)
    loadMessages()
  }, [loadMessages])

  const handleMarkRead = async (id: string, is_read: boolean) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read }),
      })
      if (res.ok) {
        await loadMessages()
        if (selectedMessage?.id === id) {
          setSelectedMessage(prev => prev ? { ...prev, is_read } : null)
        }
      }
    } catch (error) {
      console.error('Failed to update message:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/inbox?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedMessage?.id === id) setSelectedMessage(null)
        await loadMessages()
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (!msg.is_read) {
      await handleMarkRead(msg.id, true)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)

    if (diffHrs < 1) return `${Math.round(diffMs / (1000 * 60))}m ago`
    if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`
    if (diffHrs < 48) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Inbox</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Contact form messages from visitors</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Messages</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Unread</p>
          <p className="text-3xl font-bold text-green-500">{stats.unread}</p>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Read</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.read}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {(['all', 'unread', 'read'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? 'bg-green-500 text-black'
                  : ''
              }`}
              style={activeTab !== tab ? { color: 'var(--text-secondary)' } : undefined}
            >
              {tab} {tab === 'unread' && stats.unread > 0 && `(${stats.unread})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name, email, or subject..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="px-4 py-2 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-green-500"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Message List & Detail */}
      <div className="flex gap-6" style={{ minHeight: '500px' }}>
        {/* Message List */}
        <div className="flex-1 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <svg className="w-12 h-12 mb-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p style={{ color: 'var(--text-secondary)' }}>No messages found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`flex items-start gap-4 p-4 cursor-pointer transition hover:bg-green-500/5 ${
                    selectedMessage?.id === msg.id ? 'bg-green-500/10' : ''
                  } ${!msg.is_read ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}`}
                  style={{ borderBottomColor: 'var(--border-color)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm truncate ${!msg.is_read ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--text-primary)' }}>
                        {msg.name}
                      </span>
                      {!msg.is_read && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm truncate mb-1" style={{ color: !msg.is_read ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {msg.subject}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {msg.message}
                    </p>
                  </div>
                  <span className="text-xs flex-shrink-0 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm disabled:opacity-30 hover:bg-green-500/10 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                Previous
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm disabled:opacity-30 hover:bg-green-500/10 transition"
                style={{ color: 'var(--text-secondary)' }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Message Detail Panel */}
        <div className="w-[400px] rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Detail Header */}
              <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedMessage.name}</h3>
                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-green-500 hover:text-green-400 transition">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-1 rounded hover:bg-green-500/10 transition"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedMessage.is_read
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {selectedMessage.is_read ? 'Read' : 'Unread'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {selectedMessage.subject}
                  </span>
                </div>

                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(selectedMessage.created_at).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Message Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {selectedMessage.message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => handleMarkRead(selectedMessage.id, !selectedMessage.is_read)}
                  disabled={actionLoading === selectedMessage.id}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 hover:bg-green-500/10"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center bg-green-500 text-black hover:bg-green-600 transition"
                >
                  Reply
                </a>
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  disabled={actionLoading === selectedMessage.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition disabled:opacity-50"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <svg className="w-16 h-16 mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
