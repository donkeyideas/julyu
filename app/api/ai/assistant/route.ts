import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import { buildShoppingAssistantPrompt } from '@/lib/llm/prompt-templates/shopping-assistant'
import { buildUserContext, formatContextForPrompt } from '@/lib/ai/context-builder'
import {
  loadConversationMemory,
  buildMessagesWithMemory,
  updateConversationMemory,
  createConversation,
} from '@/lib/ai/conversation-memory'
import { parseActionsFromResponse, executeAction } from '@/lib/ai/tools'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Ensure user exists in public.users table (required for FK constraints)
async function ensureUserExists(userId: string, email?: string | null, fullName?: string | null): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existing) {
      // User doesn't exist in public.users — create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email || `user-${userId.slice(0, 8)}@unknown`,
          full_name: fullName || 'User',
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        // Could be a race condition (another request created the user) — check if user now exists
        const { data: recheckUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single()

        if (!recheckUser) {
          console.error('[ensureUserExists] Failed to create user:', insertError)
        }
      }
    }
  } catch (err) {
    console.error('[ensureUserExists] Unexpected error:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in public.users (needed for ai_conversations FK)
    const userEmail = user?.email || request.headers.get('x-user-email')
    const userName = user?.user_metadata?.full_name || request.headers.get('x-user-name')
    await ensureUserExists(userId, userEmail, userName as string | null)

    const body = await request.json()
    const { messages, conversation_id } = body as { messages: Message[]; conversation_id?: string }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    const lastUserMessage = messages[messages.length - 1]
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
    }

    // Build full user context (parallelized queries)
    const userContext = await buildUserContext(userId)

    // Build context-aware system prompt with full context
    const systemPrompt = buildShoppingAssistantPrompt({
      dietaryRestrictions: userContext.preferences.dietaryRestrictions,
      budgetMonthly: userContext.preferences.budgetMonthly ?? undefined,
      budgetRemaining: userContext.preferences.budgetRemaining ?? undefined,
      favoriteStores: userContext.preferences.favoriteStores,
      recentPurchases: userContext.recentPurchases,
      activeListItems: userContext.activeListItems,
      pendingAlerts: userContext.pendingAlerts,
      householdSize: userContext.preferences.householdSize ?? undefined,
    })

    // If we have a conversation, load memory (summary + recent messages)
    let convId: string | null = conversation_id ?? null
    let llmMessages

    if (convId) {
      // Existing conversation — use memory system
      const memory = await loadConversationMemory(convId, userId)
      llmMessages = buildMessagesWithMemory(
        systemPrompt,
        memory,
        lastUserMessage.content
      )
    } else {
      // New conversation — use messages from client
      llmMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ]
    }

    // Get AI response via orchestrator (handles routing, caching, rate limiting, cost tracking)
    const llmResponse = await llmOrchestrator.chat(llmMessages, {
      taskType: 'chat',
      userId,
    })

    const response = llmResponse.content
    const tokens = {
      input: llmResponse.usage.inputTokens,
      output: llmResponse.usage.outputTokens,
    }

    // Parse any actions from the response and execute them
    const detectedActions = parseActionsFromResponse(response)
    const actionResults = []

    for (const action of detectedActions) {
      const result = await executeAction(action.action, action.params, userId)
      actionResults.push(result)
    }

    // Create or update conversation
    if (!convId) {
      convId = await createConversation(userId, lastUserMessage.content)

      // Fallback: direct insert if createConversation failed
      if (!convId) {
        console.error('[AI Assistant] createConversation returned null, trying direct insert for user:', userId)
        try {
          const dbClient = createServiceRoleClient()
          const fallbackTitle = lastUserMessage.content.slice(0, 60).replace(/\s+/g, ' ').trim() || 'New Conversation'
          const { data: directConv, error: directError } = await dbClient
            .from('ai_conversations')
            .insert({ user_id: userId, title: fallbackTitle })
            .select('id')
            .single()

          if (directError) {
            console.error('[AI Assistant] Direct conversation insert also failed:', directError)
          } else if (directConv) {
            convId = directConv.id
            console.log('[AI Assistant] Direct insert succeeded, convId:', convId)
          }
        } catch (directErr) {
          console.error('[AI Assistant] Direct insert exception:', directErr)
        }
      }
    }

    // Store messages via conversation memory (handles summarization in background)
    if (convId) {
      try {
        await updateConversationMemory(
          convId,
          userId,
          lastUserMessage.content,
          response,
          { tokens, actions: actionResults.length > 0 ? actionResults : undefined }
        )
      } catch (memoryError) {
        console.error('[AI Assistant] Failed to save conversation memory:', memoryError)
        // Fallback: try direct message inserts
        try {
          const dbClient = createServiceRoleClient()
          await dbClient.from('ai_messages').insert([
            { conversation_id: convId, role: 'user', content: lastUserMessage.content },
            { conversation_id: convId, role: 'assistant', content: response, metadata: { tokens, actions: actionResults.length > 0 ? actionResults : undefined } },
          ])
        } catch {
          console.error('[AI Assistant] Direct message insert also failed')
        }
      }
    }

    return NextResponse.json({
      response,
      conversation_id: convId,
      tokens,
      actions: actionResults.length > 0 ? actionResults : undefined,
      _debug: !convId ? { error: 'conversation_creation_failed', userId } : undefined,
    })
  } catch (error) {
    console.error('AI Assistant error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get AI response'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations (bypasses RLS for Firebase users)
    const dbClient = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (conversationId) {
      // Get specific conversation with messages
      const { data: conversation } = await dbClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      const { data: messages } = await dbClient
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      return NextResponse.json({ conversation, messages: messages || [] })
    }

    // Get all conversations
    const { data: conversations } = await dbClient
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
