import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // Verify user is participant
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single()

    if (!conversation?.participant_ids?.includes(userId) && !isTestMode) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(id, email, full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Chat] Messages error:', error)
      if (isTestMode) {
        return NextResponse.json({ messages: getTestMessages(conversationId) })
      }
      throw error
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    // Verify user is participant
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single()

    if (!conversation?.participant_ids?.includes(userId) && !isTestMode) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:users(id, email, full_name)
      `)
      .single()

    if (error) {
      console.error('[Chat] Send message error:', error)
      if (isTestMode) {
        return NextResponse.json({
          message: {
            id: `msg-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: userId,
            content: content.trim(),
            created_at: new Date().toISOString(),
            sender: { id: userId, email: 'demo@julyu.com', full_name: 'Demo User' }
          }
        })
      }
      throw error
    }

    // Update conversation last message
    await supabase
      .from('chat_conversations')
      .update({
        last_message: content.trim().substring(0, 100),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

function getTestMessages(conversationId: string) {
  if (conversationId === 'test-conv-1') {
    return [
      {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'friend-1',
        content: "Hi! I just found this amazing pasta recipe. It uses fresh tomatoes, garlic, basil, and parmesan cheese.",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        sender: { id: 'friend-1', email: 'sarah@example.com', full_name: 'Sarah Johnson' }
      },
      {
        id: 'msg-2',
        conversation_id: conversationId,
        sender_id: 'test-user-id',
        content: "That sounds delicious! What kind of pasta do you use?",
        created_at: new Date(Date.now() - 6900000).toISOString(),
        sender: { id: 'test-user-id', email: 'demo@julyu.com', full_name: 'Demo User' }
      },
      {
        id: 'msg-3',
        conversation_id: conversationId,
        sender_id: 'friend-1',
        content: "I usually go with penne or rigatoni. You'll also need olive oil and some red pepper flakes if you like it spicy!",
        created_at: new Date(Date.now() - 6600000).toISOString(),
        sender: { id: 'friend-1', email: 'sarah@example.com', full_name: 'Sarah Johnson' }
      },
      {
        id: 'msg-4',
        conversation_id: conversationId,
        sender_id: 'test-user-id',
        content: "Perfect! I need to get milk, eggs, and bread anyway. I'll add those ingredients to my list.",
        created_at: new Date(Date.now() - 6300000).toISOString(),
        sender: { id: 'test-user-id', email: 'demo@julyu.com', full_name: 'Demo User' }
      },
      {
        id: 'msg-5',
        conversation_id: conversationId,
        sender_id: 'friend-1',
        content: "Hey! Did you try that chicken recipe?",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender: { id: 'friend-1', email: 'sarah@example.com', full_name: 'Sarah Johnson' }
      }
    ]
  }

  return [
    {
      id: 'msg-a',
      conversation_id: conversationId,
      sender_id: 'friend-2',
      content: "Hey! Kroger has eggs on sale this week - only $2.49 a dozen!",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender: { id: 'friend-2', email: 'mike@example.com', full_name: 'Mike Chen' }
    },
    {
      id: 'msg-b',
      conversation_id: conversationId,
      sender_id: 'test-user-id',
      content: "Thanks for the tip! I was just about to go shopping.",
      created_at: new Date(Date.now() - 3300000).toISOString(),
      sender: { id: 'test-user-id', email: 'demo@julyu.com', full_name: 'Demo User' }
    },
    {
      id: 'msg-c',
      conversation_id: conversationId,
      sender_id: 'friend-2',
      content: "Kroger has eggs on sale this week!",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender: { id: 'friend-2', email: 'mike@example.com', full_name: 'Mike Chen' }
    }
  ]
}
