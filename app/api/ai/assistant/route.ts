import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { aiAssistant } from '@/lib/ai/assistant'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type ShoppingListRow = {
  id: string
}

type ShoppingListItemRow = {
  user_input: string | null
}

type ReceiptStoreRow = {
  name?: string | null
  retailer?: string | null
}

type ReceiptRow = {
  total_amount: number | null
  purchase_date: string | null
  stores: ReceiptStoreRow | null
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

    // Use service role client for database operations (bypasses RLS for Firebase users)
    const dbClient = createServiceRoleClient()

    const body = await request.json()
    const { messages, conversation_id } = body as { messages: Message[]; conversation_id?: string }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Get user context for better responses
    const context = await getUserContext(dbClient, userId)

    // Get AI response
    const { response, tokens } = await aiAssistant.chat(messages, {
      user_id: userId,
      ...context
    })

    // If this is a new conversation, create it
    let convId = conversation_id
    if (!convId) {
      const title = await aiAssistant.generateTitle(messages)
      const { data: newConv, error: convError } = await dbClient
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title
        })
        .select('id')
        .single()

      if (convError) {
        console.error('Failed to create conversation:', convError)
      } else {
        convId = newConv.id
      }
    }

    // Store messages in database
    if (convId) {
      // Store user message
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage && lastUserMessage.role === 'user') {
        await dbClient.from('ai_messages').insert({
          conversation_id: convId,
          role: 'user',
          content: lastUserMessage.content
        })
      }

      // Store assistant response
      await dbClient.from('ai_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: response,
        metadata: { tokens }
      })

      // Update conversation timestamp
      await dbClient
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId)
    }

    return NextResponse.json({
      response,
      conversation_id: convId,
      tokens
    })
  } catch (error) {
    console.error('AI Assistant error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get AI response'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function getUserContext(supabase: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const context: {
    preferences?: {
      dietary_restrictions?: string[]
      budget_monthly?: number
      favorite_stores?: string[]
    }
    recent_lists?: string[]
    recent_receipts?: Array<{ store: string; total: number; date: string }>
  } = {}

  try {
    // Get user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('dietary_restrictions, budget_monthly, favorite_stores')
      .eq('user_id', userId)
      .single()

    if (prefs) {
      context.preferences = {
        dietary_restrictions: prefs.dietary_restrictions as string[] | undefined,
        budget_monthly: prefs.budget_monthly ?? undefined,
        favorite_stores: prefs.favorite_stores as string[] | undefined
      }
    }

    // Get recent shopping list items
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(3)

    const listRows: ShoppingListRow[] = lists ?? []
    if (listRows.length > 0) {
      const listIds = listRows.map(l => l.id)
      const { data: items } = await supabase
        .from('list_items')
        .select('user_input')
        .in('list_id', listIds)
        .limit(20)

      const listItems: ShoppingListItemRow[] = items ?? []
      if (listItems.length > 0) {
        context.recent_lists = listItems
          .map(i => i.user_input)
          .filter((input): input is string => Boolean(input))
      }
    }

    // Get recent receipts
    const { data: receipts } = await supabase
      .from('receipts')
      .select(`
        total_amount,
        purchase_date,
        stores (
          name,
          retailer
        )
      `)
      .eq('user_id', userId)
      .eq('ocr_status', 'complete')
      .order('purchase_date', { ascending: false })
      .limit(5)

    const receiptRows: ReceiptRow[] = receipts ?? []
    if (receiptRows.length > 0) {
      context.recent_receipts = receiptRows.map(r => ({
        store: r.stores?.name || r.stores?.retailer || 'Unknown Store',
        total: r.total_amount || 0,
        date: r.purchase_date || new Date().toISOString()
      }))
    }
  } catch (error) {
    console.error('Failed to fetch user context:', error)
  }

  return context
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
