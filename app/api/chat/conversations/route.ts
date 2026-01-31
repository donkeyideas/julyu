import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

interface ConversationRow {
  id: string
  participant_ids: string[]
  last_message: string | null
  last_message_at: string | null
  created_at: string
  participants?: { user: { id: string; email: string; full_name: string | null } | null }[]
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createServiceRoleClient() as any

    // Fetch conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[Chat] Conversations error:', error)
      return NextResponse.json({ conversations: [] })
    }

    // Fetch participants for each conversation using participant_ids directly
    const transformed = await Promise.all(
      (conversations || []).map(async (conv: { id: string; participant_ids: string[]; last_message: string | null; last_message_at: string | null; created_at: string }) => {
        // Fetch user details for all participants
        const { data: participants } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', conv.participant_ids || [])

        return {
          ...conv,
          participants: participants || []
        }
      })
    )

    return NextResponse.json({ conversations: transformed })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let participantId: string | null = null
  let requestBody: { participant_id?: string; participant_email?: string; participant_name?: string } = {}

  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requestBody = await request.json()
    participantId = requestBody.participant_id || null

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 })
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createServiceRoleClient() as any

    // Check if conversation already exists between these two users
    const { data: existing, error: existingError } = await supabase
      .from('chat_conversations')
      .select('*')
      .contains('participant_ids', [userId, participantId])
      .single()

    if (existing && !existingError) {
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
        participant_ids: [userId, participantId],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Chat] Create conversation error:', error)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Create participant records (ignore errors)
    await supabase.from('chat_participants').insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: participantId }
    ]).catch(() => {})

    // Fetch participants
    const { data: participants } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', [userId, participantId])

    return NextResponse.json({
      conversation: {
        ...conversation,
        participants: participants || []
      }
    })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
