import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface ConversationRow {
  id: string
  participant_ids: string[]
  last_message: string | null
  last_message_at: string | null
  created_at: string
  participants?: { user: { id: string; email: string; full_name: string | null } | null }[]
}

export async function GET() {
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

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        participants:chat_participants(
          user:users(id, email, full_name)
        )
      `)
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('[Chat] Conversations error:', error)
      if (isTestMode) {
        return NextResponse.json({ conversations: getTestConversations() })
      }
      throw error
    }

    // Transform participants
    const transformed = (conversations as ConversationRow[] | null)?.map((conv: ConversationRow) => ({
      ...conv,
      participants: conv.participants?.map((p) => p.user).filter(Boolean) || []
    })) || []

    return NextResponse.json({ conversations: transformed })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 })
    }

    // Check if conversation already exists between these two users
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('*')
      .contains('participant_ids', [userId, participant_id])
      .single()

    if (existing) {
      // Fetch participants
      const { data: participants } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', existing.participant_ids)

      return NextResponse.json({
        conversation: {
          ...existing,
          participants: participants || []
        }
      })
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        participant_ids: [userId, participant_id],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Chat] Create conversation error:', error)
      if (isTestMode) {
        return NextResponse.json({
          conversation: {
            id: `conv-${Date.now()}`,
            participant_ids: [userId, participant_id],
            participants: [],
            created_at: new Date().toISOString()
          }
        })
      }
      throw error
    }

    // Create participant records
    await supabase.from('chat_participants').insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: participant_id }
    ])

    // Fetch participants
    const { data: participants } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', [userId, participant_id])

    return NextResponse.json({
      conversation: {
        ...conversation,
        participants: participants || []
      }
    })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

function getTestConversations() {
  return [
    {
      id: 'test-conv-1',
      participant_ids: ['test-user-id', 'friend-1'],
      participants: [
        { id: 'test-user-id', email: 'demo@julyu.com', full_name: 'Demo User' },
        { id: 'friend-1', email: 'sarah@example.com', full_name: 'Sarah Johnson' }
      ],
      last_message: "Hey! Did you try that chicken recipe?",
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'test-conv-2',
      participant_ids: ['test-user-id', 'friend-2'],
      participants: [
        { id: 'test-user-id', email: 'demo@julyu.com', full_name: 'Demo User' },
        { id: 'friend-2', email: 'mike@example.com', full_name: 'Mike Chen' }
      ],
      last_message: "Kroger has eggs on sale this week!",
      last_message_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date().toISOString()
    }
  ]
}
