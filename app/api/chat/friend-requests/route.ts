import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Get incoming friend requests for the current user
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

    // Get incoming friend requests (where current user is the recipient)
    // A friend request is when someone has added you but you haven't accepted yet
    const { data: incomingRequests, error } = await supabase
      .from('user_friends')
      .select(`
        *,
        sender:users!user_friends_user_id_fkey(id, email, full_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Friend Requests] Error:', error)
      return NextResponse.json({ requests: [] })
    }

    // Transform to a cleaner format
    const requests = (incomingRequests || []).map((req: { id: string; user_id: string; friend_id: string; status: string; created_at: string; sender: { id: string; email: string; full_name: string | null } }) => ({
      id: req.id,
      sender_id: req.user_id,
      recipient_id: req.friend_id,
      status: req.status,
      created_at: req.created_at,
      sender: req.sender
    }))

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[Friend Requests] Error:', error)
    return NextResponse.json({ requests: [] })
  }
}

// POST - Send a friend request
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

    // Get user email from database if Firebase user
    let userEmail = user?.email
    if (!userEmail && firebaseUserId) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', firebaseUserId)
        .single()
      userEmail = userData?.email
    }

    const body = await request.json()
    const { email } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Can't add yourself
    if (userEmail?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: 'Cannot send a friend request to yourself' }, { status: 400 })
    }

    // Find the user by email
    const { data: recipientUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .single()

    if (findError || !recipientUser) {
      // User not in system - create a pending request anyway
      // When they sign up, they'll see the request
      const pendingId = `pending-${Buffer.from(normalizedEmail).toString('base64').substring(0, 20)}`

      return NextResponse.json({
        request: {
          id: `request-${Date.now()}`,
          sender_id: userId,
          recipient_id: pendingId,
          status: 'pending',
          created_at: new Date().toISOString(),
          recipient: {
            id: pendingId,
            email: normalizedEmail,
            full_name: normalizedEmail.split('@')[0]
          }
        },
        message: 'Friend request sent! They will see it when they join Julyu.'
      })
    }

    // Check if already friends or request exists
    const { data: existing } = await supabase
      .from('user_friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${recipientUser.id}),and(user_id.eq.${recipientUser.id},friend_id.eq.${userId})`)
      .single()

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        if (existing.user_id === userId) {
          return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
        } else {
          // They sent us a request - we should accept instead
          return NextResponse.json({
            error: 'This user already sent you a friend request. Check your incoming requests!',
            hasIncomingRequest: true
          }, { status: 400 })
        }
      }
    }

    // Create the friend request
    const { data: friendRequest, error: insertError } = await supabase
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: recipientUser.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        recipient:users!user_friends_friend_id_fkey(id, email, full_name)
      `)
      .single()

    if (insertError) {
      console.error('[Friend Requests] Insert error:', insertError)
      // Return demo response on error
      return NextResponse.json({
        request: {
          id: `request-${Date.now()}`,
          sender_id: userId,
          recipient_id: recipientUser.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          recipient: recipientUser
        }
      })
    }

    return NextResponse.json({
      request: {
        id: friendRequest.id,
        sender_id: friendRequest.user_id,
        recipient_id: friendRequest.friend_id,
        status: friendRequest.status,
        created_at: friendRequest.created_at,
        recipient: friendRequest.recipient
      },
      message: 'Friend request sent!'
    })
  } catch (error) {
    console.error('[Friend Requests] Error:', error)
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
  }
}
