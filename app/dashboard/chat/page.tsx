'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string | null
}

interface ChatMessage {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
  extracted_items?: string[]
  translatedContent?: string
  isTranslating?: boolean
}

interface ChatConversation {
  id: string
  participant_ids: string[]
  participants: User[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  friend: User
  created_at: string
}

interface FriendRequest {
  id: string
  sender_id: string
  recipient_id: string
  status: string
  created_at: string
  sender: User
}

export default function ChatPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [extractedItems, setExtractedItems] = useState<string[]>([])
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [userLanguage, setUserLanguage] = useState('en')
  const [autoTranslate, setAutoTranslate] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
    fetchConversations()
    fetchFriends()
    fetchFriendRequests()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name
          })
        }
        // Get language preferences
        if (data.preferences?.preferred_language) {
          setUserLanguage(data.preferences.preferred_language)
        }
        if (data.preferences?.auto_translate_chat !== undefined) {
          setAutoTranslate(data.preferences.auto_translate_chat)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const translateMessage = async (messageId: string, content: string) => {
    // Update message to show translating state
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isTranslating: true } : m
    ))

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLang: userLanguage
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.translatedText !== content) {
          setMessages(prev => prev.map(m =>
            m.id === messageId
              ? { ...m, translatedContent: data.translatedText, isTranslating: false }
              : m
          ))
        } else {
          setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, isTranslating: false } : m
          ))
        }
      }
    } catch (error) {
      console.error('Translation error:', error)
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isTranslating: false } : m
      ))
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/chat/friends')
      if (response.ok) {
        const data = await response.json()
        const apiFriends = data.friends || []

        // Load pending friends from localStorage and merge
        const storedPending = localStorage.getItem('pendingFriends')
        let pendingFriends: Friend[] = []
        if (storedPending) {
          try {
            pendingFriends = JSON.parse(storedPending)
          } catch (e) {
            console.error('Failed to parse pending friends:', e)
          }
        }

        // Merge API friends with pending friends (avoid duplicates)
        const pendingEmails = new Set(apiFriends.map((f: Friend) => f.friend.email.toLowerCase()))
        const uniquePending = pendingFriends.filter(
          pf => !pendingEmails.has(pf.friend.email.toLowerCase())
        )

        setFriends([...apiFriends, ...uniquePending])
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error)
      // Load from localStorage only on error
      const storedPending = localStorage.getItem('pendingFriends')
      if (storedPending) {
        try {
          setFriends(JSON.parse(storedPending))
        } catch (e) {
          console.error('Failed to parse pending friends:', e)
        }
      }
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/chat/friend-requests')
      if (response.ok) {
        const data = await response.json()
        setFriendRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error)
    }
  }

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setProcessingRequest(requestId)
    try {
      const response = await fetch(`/api/chat/friend-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        const data = await response.json()

        // Remove the request from list
        setFriendRequests(prev => prev.filter(r => r.id !== requestId))

        // If accepted, refresh friends list
        if (action === 'accept' && data.friend) {
          fetchFriends()
        }
      }
    } catch (error) {
      console.error('Failed to handle friend request:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const loadConversation = async (conversation: ChatConversation) => {
    setActiveConversation(conversation)
    try {
      const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const startNewConversation = async (friend: Friend) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: friend.friend_id,
          participant_email: friend.friend.email,
          participant_name: friend.friend.full_name || friend.friend.email.split('@')[0]
        })
      })
      if (response.ok) {
        const data = await response.json()
        setActiveConversation(data.conversation)
        setMessages([])
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
    setShowFriends(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sending) return

    const messageContent = input.trim()
    setInput('')
    setSending(true)

    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser?.id || '',
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: currentUser || undefined
    }
    setMessages(prev => [...prev, tempMessage])

    try {
      const response = await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      })

      if (response.ok) {
        const data = await response.json()
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? data.message : m))
        fetchConversations() // Update last message
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addFriend = async () => {
    if (!friendEmail.trim()) return
    setAddFriendError('')

    try {
      const response = await fetch('/api/chat/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if user has incoming request from this person
        if (data.hasIncomingRequest) {
          setAddFriendError(data.error || 'This user already sent you a friend request!')
        } else {
          setAddFriendError(data.error || 'Failed to send friend request')
        }
        return
      }

      // Add the new friend request to local state
      if (data.friend) {
        setFriends(prev => [...prev, data.friend])

        // If it's a pending friend request, save to localStorage for persistence
        if (data.friend.status === 'pending') {
          const storedPending = localStorage.getItem('pendingFriends')
          let pendingFriends: Friend[] = []
          if (storedPending) {
            try {
              pendingFriends = JSON.parse(storedPending)
            } catch (e) {
              console.error('Failed to parse pending friends:', e)
            }
          }
          // Add new pending friend if not already there
          if (!pendingFriends.some(f => f.friend.email === data.friend.friend.email)) {
            pendingFriends.push(data.friend)
            localStorage.setItem('pendingFriends', JSON.stringify(pendingFriends))
          }
        }
      }

      setFriendEmail('')
      setShowAddFriend(false)

      // Refresh from server
      fetchFriends()
    } catch (error) {
      console.error('Failed to send friend request:', error)
      setAddFriendError('Failed to send friend request')
    }
  }

  const extractItemsFromChat = () => {
    // Parse messages for food items (simple pattern matching)
    const items: string[] = []
    const foodPatterns = [
      /(\d+)?\s*(lbs?|pounds?|oz|ounces?|gallons?|gal|dozen|doz|cups?|packages?|packs?|bags?|cans?|bottles?|jars?|boxes?)?\s*(of\s+)?([a-zA-Z\s]+(?:chicken|beef|pork|fish|salmon|shrimp|milk|eggs?|bread|cheese|butter|yogurt|fruit|vegetables?|apples?|bananas?|oranges?|tomatoes?|potatoes?|onions?|carrots?|lettuce|spinach|rice|pasta|noodles?|flour|sugar|salt|pepper|oil|sauce|soup|cereal|oatmeal|coffee|tea|juice))/gi,
      /(?:need|buy|get|grab|pick up)\s+(?:some\s+)?([a-zA-Z\s]+)/gi,
      /(?:recipe|ingredients?)[\s:]+([^.!?]+)/gi
    ]

    messages.forEach(msg => {
      const content = msg.content
      // Simple extraction - look for common food items
      const words = content.toLowerCase().split(/[\s,;]+/)
      const commonItems = ['milk', 'eggs', 'bread', 'butter', 'cheese', 'chicken', 'beef', 'fish', 'rice',
                          'pasta', 'tomatoes', 'onions', 'potatoes', 'apples', 'bananas', 'oranges',
                          'lettuce', 'spinach', 'carrots', 'yogurt', 'cereal', 'flour', 'sugar', 'oil']

      words.forEach((word, idx) => {
        const cleanWord = word.replace(/[^a-z]/g, '')
        if (commonItems.includes(cleanWord) && !items.includes(cleanWord)) {
          // Check for quantity before
          const prevWord = words[idx - 1]
          if (prevWord && /^\d+$/.test(prevWord)) {
            items.push(`${prevWord} ${cleanWord}`)
          } else {
            items.push(cleanWord)
          }
        }
      })
    })

    setExtractedItems([...new Set(items)])
    setShowExtractModal(true)
  }

  const compareExtractedItems = () => {
    if (extractedItems.length === 0) return
    localStorage.setItem('compareItems', JSON.stringify(extractedItems))
    router.push('/dashboard/compare?fromAssistant=true')
  }

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participants?.find(p => p.id !== currentUser?.id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Community Chat</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Share recipes and shopping tips with friends</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFriends(true)}
            className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Friends
            {friendRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                {friendRequests.length}
              </span>
            )}
          </button>
          {activeConversation && messages.length > 0 && (
            <button
              onClick={extractItemsFromChat}
              className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Extract Items
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-72 rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const other = getOtherParticipant(conv)
                const isActive = activeConversation?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full p-4 text-left transition ${isActive ? 'bg-green-500/15' : 'hover:opacity-80'}`}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                        {(other?.full_name || other?.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isActive ? 'text-green-500' : ''}`} style={{ color: isActive ? undefined : 'var(--text-primary)' }}>
                          {other?.full_name || other?.email || 'Unknown'}
                        </div>
                        {conv.last_message && (
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {conv.last_message}
                          </div>
                        )}
                      </div>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm mb-4">No conversations yet</p>
                <button
                  onClick={() => setShowFriends(true)}
                  className="text-green-500 hover:text-green-400 text-sm font-medium"
                >
                  Start a chat with a friend
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                  {(getOtherParticipant(activeConversation)?.full_name || getOtherParticipant(activeConversation)?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getOtherParticipant(activeConversation)?.full_name || getOtherParticipant(activeConversation)?.email}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {getOtherParticipant(activeConversation)?.email}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => {
                    const isMine = message.sender_id === currentUser?.id
                    const showTranslateOption = !isMine && autoTranslate && userLanguage !== 'en'
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${isMine ? 'bg-green-500' : ''}`}
                            style={!isMine ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' } : undefined}
                          >
                            <div className={`text-sm ${isMine ? 'text-white' : ''}`} style={!isMine ? { color: 'var(--text-primary)' } : undefined}>
                              {message.translatedContent || message.content}
                            </div>
                            {message.translatedContent && (
                              <div className="text-xs mt-2 pt-2 italic" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Original: {message.content}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-xs mt-1 ${isMine ? 'justify-end' : 'justify-start'}`} style={{ color: 'var(--text-muted)' }}>
                            {formatTime(message.created_at)}
                            {showTranslateOption && !message.translatedContent && !message.isTranslating && (
                              <button
                                onClick={() => translateMessage(message.id, message.content)}
                                className="text-green-500 hover:text-green-400 transition"
                                title="Translate to your language"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                              </button>
                            )}
                            {message.isTranslating && (
                              <span className="text-green-500">Translating...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm"
                    style={{ minHeight: '48px', maxHeight: '120px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="p-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Start Chatting</h3>
                <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                  Select a conversation or start a new one with a friend
                </p>
                <button
                  onClick={() => setShowFriends(true)}
                  className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Friends</h3>
              <button
                onClick={() => setShowFriends(false)}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Add Friend Section */}
              {showAddFriend ? (
                <div className="mb-6">
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Enter friend's email..."
                    className="w-full rounded-lg px-4 py-3 mb-2 focus:border-green-500 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  {addFriendError && (
                    <p className="text-red-500 text-sm mb-2">{addFriendError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddFriend(false); setFriendEmail(''); setAddFriendError('') }}
                      className="flex-1 px-4 py-2 rounded-lg hover:opacity-80 transition"
                      style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addFriend}
                      className="flex-1 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full px-4 py-3 mb-6 rounded-lg transition flex items-center justify-center gap-2"
                  style={{ border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Friend
                </button>
              )}

              {/* Incoming Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Incoming Requests ({friendRequests.length})
                  </div>
                  <div className="space-y-2">
                    {friendRequests.map(request => (
                      <div
                        key={request.id}
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {(request.sender.full_name || request.sender.email)[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {request.sender.full_name || request.sender.email.split('@')[0]}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{request.sender.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFriendRequest(request.id, 'accept')}
                            disabled={processingRequest === request.id}
                            className="flex-1 px-3 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50"
                          >
                            {processingRequest === request.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(request.id, 'decline')}
                            disabled={processingRequest === request.id}
                            className="flex-1 px-3 py-2 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition text-sm disabled:opacity-50"
                            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.filter(f => f.status === 'accepted').map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => startNewConversation(friend)}
                      className="w-full p-3 rounded-lg transition flex items-center gap-3 hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                        {(friend.friend.full_name || friend.friend.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {friend.friend.full_name || friend.friend.email}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{friend.friend.email}</div>
                      </div>
                      <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  ))}

                  {/* Sent Requests - Awaiting response */}
                  {friends.filter(f => f.status === 'pending').length > 0 && (
                    <>
                      <div className="pt-4 text-xs font-semibold uppercase flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Sent Requests
                      </div>
                      {friends.filter(f => f.status === 'pending').map(friend => (
                        <div
                          key={friend.id}
                          className="w-full p-3 rounded-lg flex items-center gap-3"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                            {(friend.friend.full_name || friend.friend.email)[0].toUpperCase()}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {friend.friend.full_name || friend.friend.email}
                            </div>
                            <div className="text-xs text-yellow-500">Waiting for them to accept...</div>
                          </div>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs mt-1">Send friend requests by email to start chatting!</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Extract Items Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Extracted Items</h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {extractedItems.length > 0 ? (
                <>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Found {extractedItems.length} items from your conversation
                  </p>
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {extractedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <span className="text-green-500 font-semibold">1x</span>
                        <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                        <button
                          onClick={() => setExtractedItems(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-auto hover:text-red-500 transition"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={compareExtractedItems}
                    className="w-full px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Compare Prices
                  </button>
                </>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No food items found in the conversation</p>
                  <p className="text-xs mt-1">Try mentioning specific grocery items like milk, eggs, bread, etc.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
