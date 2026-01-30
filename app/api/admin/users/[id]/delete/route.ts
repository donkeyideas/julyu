import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = params

    // Delete user from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      console.error('Delete user auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to delete user', details: authError.message },
        { status: 500 }
      )
    }

    // Note: Related data will be deleted automatically via CASCADE in database schema

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
