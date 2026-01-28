/**
 * Conversation Memory Manager
 * Manages multi-turn conversation context with rolling window + summarization.
 * Keeps last N messages in full, summarizes older messages to save tokens.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

const MAX_RECENT_MESSAGES = 10
const SUMMARY_THRESHOLD = 15 // Summarize when message count exceeds this

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: Record<string, unknown> | null
}

interface ConversationMemory {
  conversationId: string
  summary: string | null
  recentMessages: LLMMessage[]
  totalMessageCount: number
}

/**
 * Load conversation memory — returns a summary of older messages
 * plus the most recent messages in full.
 */
export async function loadConversationMemory(
  conversationId: string,
  userId: string
): Promise<ConversationMemory> {
  const supabase = createServiceRoleClient()

  // Get message count
  const { data: allMessages } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at, metadata')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const messages: ConversationMessage[] = (allMessages ?? []) as ConversationMessage[]
  const totalMessageCount = messages.length

  if (totalMessageCount === 0) {
    return {
      conversationId,
      summary: null,
      recentMessages: [],
      totalMessageCount: 0,
    }
  }

  // Get existing summary from context table
  const { data: contextData } = await supabase
    .from('ai_conversation_context')
    .select('context_data')
    .eq('conversation_id', conversationId)
    .eq('context_type', 'summary')
    .single()

  let summary = (contextData?.context_data as { summary?: string })?.summary ?? null

  // Take recent messages
  const recentMessages = messages
    .slice(-MAX_RECENT_MESSAGES)
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // If we have many messages and no summary, generate one
  if (totalMessageCount > SUMMARY_THRESHOLD && !summary) {
    const olderMessages = messages.slice(0, -MAX_RECENT_MESSAGES)
    if (olderMessages.length > 0) {
      summary = await generateConversationSummary(
        conversationId,
        olderMessages,
        userId
      )
    }
  }

  return {
    conversationId,
    summary,
    recentMessages,
    totalMessageCount,
  }
}

/**
 * Build LLM messages array with memory context injected.
 * Prepends summary as a system message if available.
 */
export function buildMessagesWithMemory(
  systemPrompt: string,
  memory: ConversationMemory,
  currentUserMessage: string
): LLMMessage[] {
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Inject conversation summary if available
  if (memory.summary) {
    messages.push({
      role: 'system',
      content: `Previous conversation summary (${memory.totalMessageCount - memory.recentMessages.length} older messages):\n${memory.summary}`,
    })
  }

  // Add recent messages from memory
  for (const msg of memory.recentMessages) {
    messages.push(msg)
  }

  // Add the current user message
  messages.push({ role: 'user', content: currentUserMessage })

  return messages
}

/**
 * After a response, update the conversation memory.
 * Stores messages and triggers summarization if needed.
 */
export async function updateConversationMemory(
  conversationId: string,
  userId: string,
  userMessage: string,
  assistantResponse: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Store user message
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userMessage,
  })

  // Store assistant response
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: assistantResponse,
    metadata: metadata ?? null,
  })

  // Update conversation timestamp
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Check if we need to summarize (do this async, don't block response)
  checkAndSummarize(conversationId, userId).catch(err => {
    console.error('[ConversationMemory] Background summarization failed:', err)
  })
}

/**
 * Create a new conversation and return its ID.
 */
export async function createConversation(
  userId: string,
  firstMessage: string
): Promise<string | null> {
  const supabase = createServiceRoleClient()

  // Use a simple title first to ensure conversation is created quickly
  // Title generation can be slow/flaky — don't let it block conversation creation
  const fallbackTitle = firstMessage.slice(0, 60).replace(/\s+/g, ' ').trim() || 'New Conversation'

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      title: fallbackTitle,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[ConversationMemory] Failed to create conversation:', JSON.stringify(error), 'userId:', userId, 'title:', fallbackTitle)
    return null
  }

  if (!data?.id) {
    console.error('[ConversationMemory] Insert succeeded but no ID returned. data:', JSON.stringify(data))
    return null
  }

  // Generate a better title in the background (non-blocking)
  llmOrchestrator.generateTitle(firstMessage)
    .then(async (title) => {
      if (title && title.length > 0) {
        await supabase
          .from('ai_conversations')
          .update({ title: title.slice(0, 255) })
          .eq('id', data.id)
      }
    })
    .catch(() => {
      // Title generation failed — the fallback title is fine
    })

  return data.id
}

/**
 * Check message count and trigger summarization if needed.
 */
async function checkAndSummarize(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Count messages
  const { data: messages } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const allMessages: ConversationMessage[] = (messages ?? []) as ConversationMessage[]

  if (allMessages.length <= SUMMARY_THRESHOLD) return

  // Get older messages (everything except last N)
  const olderMessages = allMessages.slice(0, -MAX_RECENT_MESSAGES)
  if (olderMessages.length < 5) return // Not enough to summarize

  await generateConversationSummary(conversationId, olderMessages, userId)
}

/**
 * Generate a summary of older conversation messages using LLM.
 */
async function generateConversationSummary(
  conversationId: string,
  messages: ConversationMessage[],
  userId: string
): Promise<string> {
  const supabase = createServiceRoleClient()

  // Build conversation text for summarization
  const conversationText = messages
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  // Use LLM to generate summary
  const summaryPrompt: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a conversation summarizer. Summarize the following conversation between a user and a grocery shopping assistant. Focus on:
- Key topics discussed (products, stores, recipes, budgets)
- User preferences discovered (dietary needs, brand preferences, store preferences)
- Actions taken (items added to lists, alerts set, comparisons made)
- Any unresolved questions or ongoing plans

Keep the summary concise (2-4 sentences). Use present tense.`,
    },
    {
      role: 'user',
      content: conversationText,
    },
  ]

  try {
    const response = await llmOrchestrator.chat(summaryPrompt, {
      taskType: 'spending_analysis',
      userId,
      maxTokens: 300,
      temperature: 0.3,
    })

    const summary = response.content.trim()

    // Store summary in conversation context table
    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from('ai_conversation_context')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('context_type', 'summary')
      .single()

    if (existing) {
      await supabase
        .from('ai_conversation_context')
        .update({
          context_data: { summary, messageCount: messages.length, generatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('ai_conversation_context')
        .insert({
          conversation_id: conversationId,
          context_type: 'summary',
          context_data: { summary, messageCount: messages.length, generatedAt: new Date().toISOString() },
        })
    }

    return summary
  } catch (error) {
    console.error('[ConversationMemory] Failed to generate summary:', error)
    return ''
  }
}
