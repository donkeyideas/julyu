'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
]

// Extract ingredients from message content
function extractIngredients(content: string): string[] {
  const ingredients: string[] = []
  const lines = content.split('\n')

  // Words that indicate a tip/suggestion, not an ingredient
  const tipStarters = ['use', 'skip', 'substitute', 'try', 'serve', 'check', 'look', 'buy', 'get', 'find', 'switching', 'consider']
  const tipPhrases = ['on sale', 'for a cheaper', 'instead of', 'if available', 'or use', 'you can', 'to save', 'for broth', 'tangy bite', 'bouillon']

  for (const line of lines) {
    // Match bullet points with ingredients
    if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')) {
      let item = line.replace(/^\s*[-*•]\s*/, '').trim()
      item = item.replace(/\*\*/g, '') // Remove bold markers

      const lowerItem = item.toLowerCase()

      // Skip if it starts with a tip word
      const firstWord = lowerItem.split(' ')[0]
      if (tipStarters.includes(firstWord)) {
        continue
      }

      // Skip if it contains tip phrases
      if (tipPhrases.some(phrase => lowerItem.includes(phrase))) {
        continue
      }

      // If it has a colon, take the part before it (the ingredient name)
      if (item.includes(':')) {
        item = item.split(':')[0].trim()
      }

      // Skip if it looks like a step or instruction
      if (lowerItem.includes('step') || lowerItem.includes('minute') || lowerItem.includes('heat') ||
          lowerItem.includes('serve') || lowerItem.includes('stir') || lowerItem.includes('mix') ||
          lowerItem.includes('cook') || lowerItem.includes('add') || lowerItem.includes('place') ||
          item.length < 2 || item.length > 50) {
        continue
      }

      // Simplify the ingredient
      const simplified = simplifyIngredient(item)
      if (simplified && simplified.length > 2 && !ingredients.includes(simplified)) {
        ingredients.push(simplified)
      }
    }
  }

  return ingredients.slice(0, 15)
}

// Simplify ingredient to searchable form
function simplifyIngredient(item: string): string {
  let simplified = item
    .replace(/^\d+[\d\/\.\s-]*\s*(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|cans?|cloves?|pieces?|bunch|bunches|head|heads|bag|bags|package|packages|bottle|bottles|jar|jars|g|kg|ml|l)?\s*/i, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return simplified
}

// Check if message likely contains a recipe/ingredients
function hasIngredients(content: string): boolean {
  const lowerContent = content.toLowerCase()
  const hasIngredientKeywords =
    lowerContent.includes('ingredient') ||
    lowerContent.includes('you\'ll need') ||
    lowerContent.includes('shopping list') ||
    lowerContent.includes('what you need') ||
    lowerContent.includes('here\'s what')
  const bulletPoints = (content.match(/^\s*[-*•]\s*.+$/gm) || []).length
  return hasIngredientKeywords && bulletPoints >= 3
}

// Simple markdown renderer
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

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
      return
    }

    flushList()

    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />)
      return
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="font-semibold text-sm mt-3 mb-1 text-green-400">
          {formatInlineMarkdown(trimmed.slice(4))}
        </h4>
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="font-bold text-base mt-3 mb-1 text-white">
          {formatInlineMarkdown(trimmed.slice(3))}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="font-bold text-lg mt-3 mb-1 text-white">
          {formatInlineMarkdown(trimmed.slice(2))}
        </h2>
      )
      return
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={index} className="flex gap-2 my-1">
          <span className="text-green-500 font-medium">{numberedMatch[1]}.</span>
          <span>{formatInlineMarkdown(numberedMatch[2])}</span>
        </div>
      )
      return
    }

    elements.push(
      <p key={index} className="my-1">
        {formatInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()
  return <div className="space-y-1">{elements}</div>
}

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
    } else {
      parts.push(remaining)
      break
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export default function AssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setShowHistory(false)
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

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id)
        loadConversations()
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

  const handleCompareIngredients = (content: string) => {
    const ingredients = extractIngredients(content)
    if (ingredients.length > 0) {
      localStorage.setItem('compareItems', JSON.stringify(ingredients))
      router.push('/dashboard/compare?fromAssistant=true')
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
    <div className="h-[calc(100vh-128px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Assistant</h1>
            <p className="text-sm text-gray-500">Your smart shopping companion</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* History Dropdown */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <div className="p-2 border-b border-gray-700">
                  <p className="text-xs text-gray-500 uppercase font-medium px-2">Recent Conversations</p>
                </div>
                {conversations.length > 0 ? (
                  <div className="p-2">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 truncate transition text-sm ${
                          conversationId === conv.id
                            ? 'bg-green-500/15 text-green-500'
                            : 'hover:bg-gray-800 text-gray-300'
                        }`}
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No conversations yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm">
                I can help with meal planning, recipe suggestions, budget tips, and finding the best deals.
              </p>

              <div className="grid grid-cols-2 gap-2 max-w-md">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500 hover:bg-gray-800/80 transition text-sm"
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
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-green-500'
                          : 'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed text-gray-200">
                          {renderMarkdown(message.content)}
                        </div>
                      ) : (
                        <div className="text-sm text-white font-medium">{message.content}</div>
                      )}
                      <div className={`text-xs mt-1.5 ${message.role === 'user' ? 'text-green-100/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* Compare Prices button for messages with ingredients */}
                    {message.role === 'assistant' && hasIngredients(message.content) && (
                      <button
                        onClick={() => handleCompareIngredients(message.content)}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 text-green-400 rounded-lg hover:from-green-500/30 hover:to-green-600/30 hover:border-green-500/60 transition-all duration-300 text-sm font-medium shadow-lg shadow-green-500/10 hover:shadow-green-500/20 animate-pulse hover:animate-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Compare Ingredient Prices
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0 flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about groceries..."
                  rows={1}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm text-white placeholder-gray-500"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  )
}
