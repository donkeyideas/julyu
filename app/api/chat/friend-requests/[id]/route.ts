import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

// PUT - Accept or decline a friend request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "accept" or "decline"' }, { status: 400 })
    }

    // Verify this request belongs to the current user as recipient (don't use foreign key joins)
    const { data: friendRequest, error: findError } = await supabase
      .from('user_friends')
      .select('*')
      .eq('id', id)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single()

    if (findError || !friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Fetch sender info separately
    const { data: sender } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', friendRequest.user_id)
      .single()

    const senderInfo = sender || { id: friendRequest.user_id, email: 'Unknown', full_name: 'Unknown User' }

    if (action === 'decline') {
      // Delete the request
      await supabase
        .from('user_friends')
        .delete()
        .eq('id', id)

      return NextResponse.json({
        success: true,
        action: 'decline',
        message: 'Friend request declined.'
      })
    }

    // Accept the request
    // 1. Update status to accepted
    const { error: updateError } = await supabase
      .from('user_friends')
      .update({ status: 'accepted' })
      .eq('id', id)

    if (updateError) {
      console.error('[Friend Requests] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to accept friend request. Please try again.' }, { status: 500 })
    }

    // 2. Create reverse relationship (so both users see each other as friends)
    await supabase
      .from('user_friends')
      .insert({
        user_id: userId,
        friend_id: friendRequest.user_id,
        status: 'accepted',
        created_at: new Date().toISOString()
      })
      .catch(() => {}) // Ignore if already exists

    return NextResponse.json({
      success: true,
      action: 'accept',
      message: 'Friend request accepted!',
      friend: senderInfo
    })
  } catch (error) {
    console.error('[Friend Requests] Error:', error)
    return NextResponse.json({ error: 'Failed to process friend request' }, { status: 500 })
  }
}

// DELETE - Cancel a sent friend request (by the sender)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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

    // Delete the request (only if user is the sender)
    const { error } = await supabase
      .from('user_friends')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) {
      console.error('[Friend Requests] Delete error:', error)
      return NextResponse.json({ error: 'Failed to cancel friend request.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Friend request cancelled.' })
  } catch (error) {
    console.error('[Friend Requests] Error:', error)
    return NextResponse.json({ error: 'Failed to cancel friend request' }, { status: 500 })
  }
}
