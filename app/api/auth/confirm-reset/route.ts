import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Verify token and reset password
export async function POST(request: NextRequest) {
  console.log('[Confirm Reset] Request received')

  try {
    const { email, token, newPassword } = await request.json()

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    console.log('[Confirm Reset] Processing for:', email)

    const supabaseAdmin = createServiceRoleClient() as any

    // Find user by email
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()

    if (fetchError) {
      console.error('[Confirm Reset] Error fetching users:', fetchError)
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }

    const user = users.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.log('[Confirm Reset] User not found')
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Verify token
    const storedToken = user.user_metadata?.reset_token
    const tokenExpiry = user.user_metadata?.reset_token_expires

    if (!storedToken || storedToken !== token) {
      console.log('[Confirm Reset] Token mismatch')
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (new Date(tokenExpiry) < new Date()) {
      console.log('[Confirm Reset] Token expired')
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    console.log('[Confirm Reset] Token valid, updating password')

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...user.user_metadata,
        reset_token: null,
        reset_token_expires: null
      }
    })

    if (updateError) {
      console.error('[Confirm Reset] Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    console.log('[Confirm Reset] Password updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('[Confirm Reset] Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
