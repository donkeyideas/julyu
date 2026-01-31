import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = params

    console.log('[DeleteUser] Deleting user:', id)

    // Try to delete user from auth (may not exist for manually created users)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      // Log but don't fail - user might only exist in public.users table
      console.log('[DeleteUser] Auth delete result:', authError.message)
    }

    // Also delete from public.users table directly (in case CASCADE doesn't trigger or user was manually created)
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (usersError) {
      console.error('[DeleteUser] Users table delete error:', usersError)
      return NextResponse.json(
        { error: 'Failed to delete user from database', details: usersError.message },
        { status: 500 }
      )
    }

    console.log('[DeleteUser] User deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('[DeleteUser] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
