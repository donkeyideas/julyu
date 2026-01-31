import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET - Get incoming friend requests for the current user
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

    // Get incoming friend requests (where current user is the recipient)
    // Don't use foreign key joins - fetch separately to avoid schema issues
    const { data: incomingRequests, error } = await supabase
      .from('user_friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Friend Requests] Error fetching requests:', error)
      return NextResponse.json({ requests: [] })
    }

    if (!incomingRequests || incomingRequests.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Fetch sender info for all requests
    const senderIds = incomingRequests.map((req: { user_id: string }) => req.user_id)
    const { data: senders, error: sendersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', senderIds)

    if (sendersError) {
      console.error('[Friend Requests] Error fetching senders:', sendersError)
    }

    // Create a map of senders
    const senderMap = new Map((senders || []).map((s: { id: string; email: string; full_name: string | null }) => [s.id, s]))

    // Transform to a cleaner format with sender info
    const requests = incomingRequests.map((req: { id: string; user_id: string; friend_id: string; status: string; created_at: string }) => ({
      id: req.id,
      sender_id: req.user_id,
      recipient_id: req.friend_id,
      status: req.status,
      created_at: req.created_at,
      sender: senderMap.get(req.user_id) || { id: req.user_id, email: 'Unknown', full_name: 'Unknown User' }
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

    // Ensure current user exists in users table
    let userEmail = user?.email
    const { data: existingUserRecord } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (existingUserRecord) {
      userEmail = existingUserRecord.email
    } else if (firebaseUserId) {
      // Firebase user doesn't exist in users table - create them
      const userFullName = request.headers.get('x-user-name') || 'User'
      const userEmailHeader = request.headers.get('x-user-email')

      if (userEmailHeader) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: firebaseUserId,
            email: userEmailHeader,
            full_name: userFullName,
            created_at: new Date().toISOString()
          })
          .select('id, email, full_name')
          .single()

        if (newUser) {
          userEmail = newUser.email
          console.log('[Friend Requests] Created user record for Firebase user:', firebaseUserId)
        } else {
          console.error('[Friend Requests] Failed to create user record:', createError)
          return NextResponse.json({ error: 'Failed to initialize user. Please try logging out and back in.' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'User email not available. Please try logging out and back in.' }, { status: 400 })
      }
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
      return NextResponse.json({ error: 'User not found. They need to create a Julyu account first.' }, { status: 404 })
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

    // Create the friend request - don't use foreign key joins
    const { data: friendRequest, error: insertError } = await supabase
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: recipientUser.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[Friend Requests] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send friend request. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      request: {
        id: friendRequest.id,
        sender_id: friendRequest.user_id,
        recipient_id: friendRequest.friend_id,
        status: friendRequest.status,
        created_at: friendRequest.created_at,
        recipient: recipientUser
      },
      message: 'Friend request sent!'
    })
  } catch (error) {
    console.error('[Friend Requests] Error:', error)
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
  }
}
