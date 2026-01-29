import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/auth/store-portal-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const storeOwnerId = params.id

    // Parse request body
    const body = await request.json()
    const { reason } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

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

    // Update store owner status to rejected
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        application_status: 'rejected',
        reviewed_by: user?.id,
        rejection_reason: reason,
        accepts_orders: false,
      })
      .eq('id', storeOwnerId)

    if (updateError) {
      console.error('Update store owner error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject application' },
        { status: 500 }
      )
    }

    // Deactivate the associated bodega store
    const { error: storeUpdateError } = await supabase
      .from('bodega_stores')
      .update({
        is_active: false,
        verified: false,
      })
      .eq('store_owner_id', storeOwnerId)

    if (storeUpdateError) {
      console.error('Update bodega store error:', storeUpdateError)
      // Continue anyway - store owner is rejected
    }

    // TODO: Send rejection email to store owner with reason

    return NextResponse.json({
      success: true,
      message: 'Store application rejected',
    })

  } catch (error) {
    console.error('Reject application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
