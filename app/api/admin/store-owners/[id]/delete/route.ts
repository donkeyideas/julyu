import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = await params

    // Get store owner to find user_id
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !storeOwner) {
      console.error('Fetch store owner error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Delete from store_owners table first (will cascade to bodega_stores)
    const { error: deleteError } = await supabaseAdmin
      .from('store_owners')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete store owner error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete store owner', details: deleteError.message },
        { status: 500 }
      )
    }

    // Delete user from auth if they have a user_id
    if (storeOwner.user_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        storeOwner.user_id
      )

      if (authError) {
        console.error('Delete user auth error:', authError)
        // Don't fail the entire request if auth deletion fails
        // The database record is already deleted
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Store owner deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting store owner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
