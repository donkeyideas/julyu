import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId
    const conversationId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const supabase = createServiceRoleClient()

    // Verify user is participant
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation?.participant_ids?.includes(userId)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Chat] Messages error:', error)
      return NextResponse.json({ messages: [] })
    }

    // Fetch sender details for each unique sender
    const senderIds = [...new Set((messages || []).map((m: { sender_id: string }) => m.sender_id))]
    const { data: senders } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', senderIds)

    // Map senders to messages
    const senderMap = new Map((senders || []).map((s: { id: string; email: string; full_name: string | null }) => [s.id, s]))
    const messagesWithSender = (messages || []).map((m: { sender_id: string }) => ({
      ...m,
      sender: senderMap.get(m.sender_id) || { id: m.sender_id, email: 'Unknown', full_name: 'Unknown' }
    }))

    return NextResponse.json({ messages: messagesWithSender })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId
    const conversationId = params.id

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations
    const supabase = createServiceRoleClient()

    // Verify user is participant
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation?.participant_ids?.includes(userId)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
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
      .select('*')
      .single()

    if (error) {
      console.error('[Chat] Send message error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Fetch sender details
    const { data: sender } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    const messageWithSender = {
      ...message,
      sender: sender || { id: userId, email: 'Unknown', full_name: 'Unknown' }
    }

    // Update conversation last message (ignore errors)
    await supabase
      .from('chat_conversations')
      .update({
        last_message: content.trim().substring(0, 100),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .catch(() => {})

    return NextResponse.json({ message: messageWithSender })
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
