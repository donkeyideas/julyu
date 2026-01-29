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

    // Get default commission tier (or lowest tier)
    const { data: defaultTier } = await supabase
      .from('commission_tiers')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Update store owner status to approved
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        application_status: 'approved',
        approval_date: new Date().toISOString(),
        reviewed_by: user?.id,
        commission_rate: defaultTier?.commission_percentage || 15.00,
        accepts_orders: true,
      })
      .eq('id', storeOwnerId)

    if (updateError) {
      console.error('Update store owner error:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve application' },
        { status: 500 }
      )
    }

    // Activate and verify the associated bodega store
    const { error: storeUpdateError } = await supabase
      .from('bodega_stores')
      .update({
        is_active: true,
        verified: true,
      })
      .eq('store_owner_id', storeOwnerId)

    if (storeUpdateError) {
      console.error('Update bodega store error:', storeUpdateError)
      // Continue anyway - store owner is approved
    }

    // TODO: Send approval email to store owner
    // TODO: Send welcome email with next steps (inventory setup, Stripe Connect)

    return NextResponse.json({
      success: true,
      message: 'Store application approved successfully',
    })

  } catch (error) {
    console.error('Approve application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
