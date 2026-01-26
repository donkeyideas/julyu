'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

const SUGGESTED_PROMPTS = [
  "What are some budget-friendly dinner ideas?",
  "Help me create a weekly meal plan",
  "What's a good substitute for butter?",
  "How can I save money on groceries?",
  "Create a shopping list for a BBQ party",
  "What items are usually cheapest at Costco?",
]

// Simple markdown renderer - converts markdown to formatted JSX
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500">•</span>
              <span>{formatInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
      return
    }

    // Flush any pending list
    flushList()

    // Empty line
    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />)
      return
    }

    // Headers
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="font-bold text-base mt-3 mb-1">
          {formatInlineMarkdown(trimmed.slice(3))}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="font-bold text-lg mt-3 mb-1">
          {formatInlineMarkdown(trimmed.slice(2))}
        </h2>
      )
      return
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="my-1">
        {formatInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()

  return <div className="space-y-1">{elements}</div>
}

// Format inline markdown (bold, italic)
function formatInlineMarkdown(text: string): React.ReactNode {
  // Split by bold markers first
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Look for **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before the match
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      // Add the bold text
      parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
    } else {
      // No more bold markers, add the rest
      parts.push(remaining)
      break
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai/assistant')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/ai/assistant?conversation_id=${convId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationId(convId)
        setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        })))
        setShowSidebar(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setShowSidebar(false)
    inputRef.current?.focus()
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          conversation_id: conversationId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update conversation ID if new
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
        loadConversations() // Refresh sidebar
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-8">
      {/* Conversation Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-20 w-64 h-full bg-gray-900 border-r border-gray-800 transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2.5 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 uppercase px-3 py-2 font-medium">Recent Conversations</div>
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 truncate transition text-sm ${
                  conversationId === conv.id
                    ? 'bg-green-500/15 text-green-500'
                    : 'hover:bg-gray-800 text-gray-400'
                }`}
              >
                {conv.title}
              </button>
            ))
          ) : (
            <p className="text-gray-600 text-sm px-3 py-2">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed bottom-24 left-4 z-30 p-3 bg-gray-800 rounded-full shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">Julyu AI Assistant</h1>
            <p className="text-xs text-gray-500">Your smart shopping companion</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm">
                I can help with meal planning, recipe suggestions, budget tips, shopping lists, and finding the best deals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg hover:border-green-500 hover:bg-gray-900/50 transition text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-green-500 text-black'
                        : 'bg-gray-900 border border-gray-800'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed text-gray-200">
                        {renderMarkdown(message.content)}
                      </div>
                    ) : (
                      <div className="text-sm">{message.content}</div>
                    )}
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-green-800' : 'text-gray-600'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about groceries..."
                  rows={1}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
