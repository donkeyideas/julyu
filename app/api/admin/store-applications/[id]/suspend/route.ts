import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { isAdmin, error: adminError } = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: adminError || 'Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { id: storeOwnerId } = await params

    // Get store owner
    const { data: storeOwner, error: fetchError } = await supabase
      .from('store_owners')
      .select('*')
      .eq('id', storeOwnerId)
      .single()

    if (fetchError || !storeOwner) {
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Can only suspend approved stores
    if (storeOwner.application_status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only suspend approved stores' },
        { status: 400 }
      )
    }

    // Update store owner status to suspended
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        application_status: 'suspended',
        reviewed_by: user?.id,
        accepts_orders: false,
      })
      .eq('id', storeOwnerId)

    if (updateError) {
      console.error('Update store owner error:', updateError)
      return NextResponse.json(
        { error: 'Failed to suspend store' },
        { status: 500 }
      )
    }

    // Deactivate the associated bodega store
    const { error: storeUpdateError } = await supabase
      .from('bodega_stores')
      .update({
        is_active: false,
      })
      .eq('store_owner_id', storeOwnerId)

    if (storeUpdateError) {
      console.error('Update bodega store error:', storeUpdateError)
      // Continue anyway - store owner is suspended
    }

    // TODO: Send suspension notification email to store owner
    // TODO: Handle any active orders gracefully

    return NextResponse.json({
      success: true,
      message: 'Store suspended successfully',
    })

  } catch (error) {
    console.error('Suspend store error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
