'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Helper to get auth headers for API calls (supports Firebase/Google users)
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('julyu_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.id) headers['x-user-id'] = user.id
        if (user.email) headers['x-user-email'] = user.email
        if (user.full_name) headers['x-user-name'] = user.full_name
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  return headers
}

interface ActionResult {
  success: boolean
  action: string
  message: string
  data?: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: ActionResult[]
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

// Strip [ACTION:...] tags from displayed text so user never sees them
function stripActionTags(text: string): string {
  return text
    .split('\n')
    .filter(line => !/^\s*\[ACTION:(ADD_TO_LIST|SET_ALERT|CHECK_BUDGET|SEARCH_PRICES|FIND_STORES)\]/i.test(line.trim()))
    .join('\n')
}

const SUGGESTED_PROMPTS = [
  "What are some budget-friendly dinner ideas?",
  "Help me create a weekly meal plan",
  "What's a good substitute for butter?",
  "How can I save money on groceries?",
]

// Extract ingredients from message content (fallback when AI extraction is unavailable)
function extractIngredients(content: string): string[] {
  const ingredients: string[] = []

  // Non-ingredient phrases to skip
  const skipPhrases = ['cost per serving', 'cost:', 'would you like', 'quick tip', 'let me know',
    'here are', 'here\'s', 'want me to', '/serving', 'per serving']
  const tipPhrases = ['on sale', 'for a cheaper', 'instead of', 'if available', 'you can', 'to save']

  const addIngredient = (item: string) => {
    const simplified = simplifyIngredient(item)
    if (simplified && simplified.length > 2 && simplified.length < 40 && !ingredients.includes(simplified)) {
      ingredients.push(simplified)
    }
  }

  // Strategy 1: Extract bold ingredients from any format (**chicken breast**)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g)
  if (boldMatches && boldMatches.length >= 2) {
    for (const match of boldMatches) {
      const item = match.replace(/\*+/g, '').trim()
      const lower = item.toLowerCase()
      // Skip non-ingredient bold text (recipe titles, tips, etc.)
      if (skipPhrases.some(p => lower.includes(p))) continue
      if (lower.length > 30 || lower.length < 2) continue
      // Skip recipe title-like bold text (starts with capital, contains multiple words with caps)
      if (/^\d+\./.test(item)) continue
      addIngredient(item)
    }
    if (ingredients.length >= 2) return ingredients.slice(0, 15)
  }

  // Strategy 2: Parse bullet and numbered list lines
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip [ACTION:...] lines
    if (/^\[ACTION:/i.test(trimmedLine)) continue

    // Match bullet points or numbered lists
    const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')
    const isNumbered = /^\d+[\.\)]\s/.test(trimmedLine)
    if (!isBullet && !isNumbered) continue

    let item = line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[\.\)]\s*/, '').trim()
    item = item.replace(/\*+/g, '') // Remove markdown bold/italic markers
    item = item.replace(/~?\$[\d.]+\S*/g, '').trim() // Remove price estimates

    const lowerItem = item.toLowerCase()

    // Skip non-ingredient lines
    if (skipPhrases.some(p => lowerItem.includes(p))) continue
    if (tipPhrases.some(p => lowerItem.includes(p))) continue
    if (lowerItem.includes('step') || lowerItem.includes('minute') || lowerItem.includes('heat') ||
        lowerItem.includes('stir') || lowerItem.includes('place') || lowerItem.includes('preheat')) continue
    if (item.length < 2) continue

    // "Use chicken breast, rice, and onion" → extract each ingredient
    const useMatch = item.match(/^Use\s+(?:your\s+)?(.+)/i)
    if (useMatch) {
      const itemsStr = useMatch[1]
        .replace(/\([^)]*\)/g, '').replace(/\([^)]*$/g, '').replace(/\s+/g, ' ')
      const parts = itemsStr.split(/,\s*|\s+and\s+|\s*\+\s*/i).map(s => s.trim()).filter(Boolean)
      for (const part of parts) { addIngredient(part) }
      continue
    }

    // "Add canned crushed tomatoes ($0.89)" → extract items
    const addMatch = item.match(/^Add\s+(.+)/i)
    if (addMatch) {
      const itemsStr = addMatch[1]
        .replace(/\([^)]*\)/g, '').replace(/\([^)]*$/g, '')
        .replace(/\s+for\s+\w+.*$/i, '').replace(/\s+if\s+.*$/i, '')
        .replace(/\s+/g, ' ')
      const parts = itemsStr.split(/,\s*|\s+and\s+/i).map(s => s.trim()).filter(Boolean)
      for (const part of parts) { if (part.length > 2) addIngredient(part) }
      continue
    }

    // If it has a colon, take the part before it
    if (item.includes(':')) {
      item = item.split(':')[0].trim()
    }

    // Skip instructional lines
    const firstWord = lowerItem.split(' ')[0]
    if (['skip', 'substitute', 'try', 'serve', 'check', 'look', 'find', 'switching', 'consider'].includes(firstWord)) continue

    addIngredient(item)
  }

  return ingredients.slice(0, 15)
}

// Simplify ingredient to searchable form
function simplifyIngredient(item: string): string {
  let simplified = item
    .replace(/\*+/g, '') // Remove markdown bold/italic
    .replace(/^\d+[\d\/\.\s-]*\s*(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|cans?|cloves?|pieces?|bunch|bunches|head|heads|bag|bags|package|packages|bottle|bottles|jar|jars|g|kg|ml|l)?\s*/i, '')
    .replace(/\([^)]*\)/g, '') // Remove complete parentheticals like (diced)
    .replace(/\([^)]*$/g, '') // Remove unclosed parentheticals like "(1:1 ratio" or "(1"
    .replace(/[—–].*$/g, '') // Remove em-dash/en-dash descriptions like "— healthy fats"
    .replace(/,.*$/, '') // Remove everything after first comma
    .replace(/\.\s*$/, '') // Remove trailing period
    .replace(/~?\$[\d.]+\S*/g, '') // Remove price estimates ($2.50, ~$2.50)
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
    lowerContent.includes('here\'s what') ||
    lowerContent.includes('dinner idea') ||
    lowerContent.includes('recipe') ||
    lowerContent.includes('meal plan') ||
    lowerContent.includes('meal idea') ||
    lowerContent.includes('budget-friendly') ||
    lowerContent.includes('here are') ||
    lowerContent.includes('substitute') ||
    lowerContent.includes('butter alternative') ||
    lowerContent.includes('cost per serving') ||
    lowerContent.includes('cost:') ||
    lowerContent.includes('/serving')

  if (!hasIngredientKeywords) return false

  // Check for bullet points OR numbered recipes with bold ingredients
  const bulletPoints = (content.match(/^\s*[-*•]\s*.+$/gm) || []).length
  const numberedItems = (content.match(/^\d+\.\s+/gm) || []).length
  const boldWords = (content.match(/\*\*[^*]+\*\*/g) || []).length
  return bulletPoints >= 3 || numberedItems >= 2 || boldWords >= 3
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
  const [extractingIngredients, setExtractingIngredients] = useState(false)
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
      const response = await fetch('/api/ai/assistant', { headers: getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        console.log('[AI Assistant] Loaded conversations:', data.conversations?.length || 0)
        setConversations(data.conversations || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[AI Assistant] Failed to load conversations:', response.status, errorData)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/ai/assistant?conversation_id=${convId}`, { headers: getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setConversationId(convId)
        setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string; metadata?: { actions?: ActionResult[] } | null }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          actions: m.metadata?.actions || undefined,
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
        headers: getAuthHeaders(),
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
        timestamp: new Date(),
        actions: data.actions || undefined,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Debug: log conversation creation issues
      if (data._debug) {
        console.warn('[AI Assistant] Conversation debug:', data._debug)
      }

      if (data.conversation_id) {
        if (!conversationId) {
          setConversationId(data.conversation_id)
        }
        // Always reload conversations after getting a response to keep history updated
        setTimeout(() => loadConversations(), 500)
      } else {
        console.warn('[AI Assistant] No conversation_id returned - history will not be saved')
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

  const handleCompareIngredients = async (content: string) => {
    setExtractingIngredients(true)
    try {
      // Use AI to extract clean ingredient names
      const response = await fetch('/api/ai/extract-ingredients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      })

      let ingredients: string[] = []
      if (response.ok) {
        const data = await response.json()
        ingredients = data.ingredients || []
      }

      // Fallback to local extraction if AI fails
      if (ingredients.length === 0) {
        ingredients = extractIngredients(content)
      }

      if (ingredients.length > 0) {
        localStorage.setItem('compareItems', JSON.stringify(ingredients))
        router.push('/dashboard/compare?fromAssistant=true')
      } else {
        alert('Could not extract ingredients from this message. Try asking the AI for a specific recipe or ingredient list.')
      }
    } catch (error) {
      console.error('Failed to extract ingredients:', error)
      // Fallback to local extraction
      const ingredients = extractIngredients(content)
      if (ingredients.length > 0) {
        localStorage.setItem('compareItems', JSON.stringify(ingredients))
        router.push('/dashboard/compare?fromAssistant=true')
      } else {
        alert('Could not extract ingredients. Please try again.')
      }
    } finally {
      setExtractingIngredients(false)
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
              className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm flex items-center gap-2"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
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
              <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="p-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <p className="text-xs uppercase font-medium px-2" style={{ color: 'var(--text-muted)' }}>Recent Conversations</p>
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
                            : 'hover:opacity-80'
                        }`}
                        style={{ color: conversationId === conv.id ? undefined : 'var(--text-secondary)' }}
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No conversations yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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
                    className="text-left px-3 py-2.5 rounded-lg hover:border-green-500 transition text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
                          : ''
                      }`}
                      style={message.role === 'assistant' ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' } : undefined}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed text-gray-200">
                          {renderMarkdown(stripActionTags(message.content))}
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
                        disabled={extractingIngredients}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 text-green-400 rounded-lg hover:from-green-500/30 hover:to-green-600/30 hover:border-green-500/60 transition-all duration-300 text-sm font-medium shadow-lg shadow-green-500/10 hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {extractingIngredients ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        )}
                        {extractingIngredients ? 'Extracting Ingredients...' : 'Compare Ingredient Prices'}
                        {!extractingIngredients && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
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
                  <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
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
                  className="w-full rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm"
                  style={{ minHeight: '48px', maxHeight: '120px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
