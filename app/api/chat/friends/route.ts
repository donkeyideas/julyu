import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const authClient = createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createServiceRoleClient()

    // Fetch friends in BOTH directions (don't use foreign key joins):
    // 1. Where current user sent the request (user_id = me, friend is in friend_id)
    // 2. Where current user received the request (friend_id = me, friend is in user_id)

    // Query 1: I sent the request - get friend info from friend_id
    const { data: sentRequests, error: error1 } = await supabase
      .from('user_friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'accepted')

    // Query 2: I received the request - get friend info from user_id (the sender)
    const { data: receivedRequests, error: error2 } = await supabase
      .from('user_friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'accepted')

    if (error1 || error2) {
      console.error('[Friends] Error fetching friends:', error1 || error2)
      return NextResponse.json({ friends: [] })
    }

    // Collect all unique friend IDs we need to look up
    const friendIds = new Set<string>()

    // For sent requests, the friend is friend_id
    ;(sentRequests || []).forEach(req => friendIds.add(req.friend_id))
    // For received requests, the friend is user_id (the sender)
    ;(receivedRequests || []).forEach(req => friendIds.add(req.user_id))

    // Fetch all friend user info at once
    let friendsMap = new Map<string, { id: string; email: string; full_name: string | null }>()

    if (friendIds.size > 0) {
      const { data: friendUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(friendIds))

      if (usersError) {
        console.error('[Friends] Error fetching friend users:', usersError)
      } else {
        friendsMap = new Map((friendUsers || []).map(u => [u.id, u]))
      }
    }

    // Combine and normalize the results
    const friendsFromSent = (sentRequests || []).map((f: Record<string, unknown>) => ({
      ...f,
      friend_id: f.friend_id,
      friend: friendsMap.get(f.friend_id as string) || {
        id: f.friend_id as string,
        email: 'Unknown',
        full_name: 'Unknown User'
      }
    }))

    const friendsFromReceived = (receivedRequests || []).map((f: Record<string, unknown>) => ({
      ...f,
      friend_id: f.user_id, // For received requests, the friend is the sender
      friend: friendsMap.get(f.user_id as string) || {
        id: f.user_id as string,
        email: 'Unknown',
        full_name: 'Unknown User'
      }
    }))

    const allFriends = [...friendsFromSent, ...friendsFromReceived]

    return NextResponse.json({ friends: allFriends })
  } catch (error: unknown) {
    console.error('[Friends] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Check for Firebase user ID in header (for Google sign-in users)
    const firebaseUserId = request.headers.get('x-user-id')

    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database operations (bypasses RLS)
    const supabase = createServiceRoleClient()

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
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 })
    }

    // First try to find user in our users table
    let friendUser: { id: string; email: string; full_name: string | null } | null = null

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser && !findError) {
      friendUser = existingUser
    } else {
      // User not in our users table - create an invite-style friend request
      console.log('[Friends] User not in users table, creating pending request with email:', normalizedEmail)

      const friendId = `pending-${Buffer.from(normalizedEmail).toString('base64').substring(0, 20)}`

      return NextResponse.json({
        friend: {
          id: `friend-${Date.now()}`,
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
          friend: {
            id: friendId,
            email: normalizedEmail,
            full_name: normalizedEmail.split('@')[0]
          },
          created_at: new Date().toISOString()
        },
        message: 'Friend request sent! They will see it when they join Julyu.',
        requestSent: true
      })
    }

    if (!friendUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if relationship already exists (in either direction)
    const { data: existingRelation } = await supabase
      .from('user_friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${userId})`)
      .single()

    if (existingRelation) {
      if (existingRelation.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 })
      }
      if (existingRelation.status === 'pending') {
        if (existingRelation.user_id === userId) {
          return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
        } else {
          // They sent us a request - tell user to check incoming requests
          return NextResponse.json({
            error: 'This user already sent you a friend request! Check your incoming requests.',
            hasIncomingRequest: true,
            incomingRequestId: existingRelation.id
          }, { status: 400 })
        }
      }
    }

    // Create friend request (pending status - recipient must accept) - don't use foreign key joins
    const { data: friend, error: insertError } = await supabase
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: friendUser.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[Friends] Insert error:', insertError)
      // Return response with friend info we already have
      return NextResponse.json({
        friend: {
          id: `friend-${Date.now()}`,
          user_id: userId,
          friend_id: friendUser.id,
          status: 'pending',
          friend: {
            id: friendUser.id,
            email: friendUser.email,
            full_name: friendUser.full_name || friendUser.email.split('@')[0]
          },
          created_at: new Date().toISOString()
        },
        message: 'Friend request sent!',
        requestSent: true
      })
    }

    return NextResponse.json({
      friend: {
        ...friend,
        friend: {
          id: friendUser.id,
          email: friendUser.email,
          full_name: friendUser.full_name || friendUser.email.split('@')[0]
        }
      },
      message: 'Friend request sent! Waiting for them to accept.',
      requestSent: true
    })
  } catch (error: unknown) {
    console.error('[Friends] Error:', error)
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 })
  }
}
