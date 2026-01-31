import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreApprovalEmail } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Approve] Starting approval process...')
    const supabaseAdmin = createServiceRoleClient() as any
    const { id } = await params
    console.log('[Approve] Processing store owner ID:', id)

    // Get store owner details first
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('business_name, business_email, user_id, application_status')
      .eq('id', id)
      .single()

    console.log('[Approve] Fetch result:', {
      found: !!storeOwner,
      currentStatus: storeOwner?.application_status,
      error: fetchError?.message
    })

    if (fetchError || !storeOwner) {
      console.error('[Approve] Fetch store owner error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Update store owner status to approved
    console.log('[Approve] Updating status to approved...')
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('store_owners')
      .update({
        application_status: 'approved',
        approval_date: new Date().toISOString(),
        accepts_orders: true,
      })
      .eq('id', id)
      .select('application_status')

    console.log('[Approve] Update result:', {
      success: !updateError,
      newStatus: updateData?.[0]?.application_status,
      error: updateError?.message
    })

    if (updateError) {
      console.error('[Approve] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve application', details: updateError.message },
        { status: 500 }
      )
    }

    // Activate associated bodega stores
    const { error: storeError } = await supabaseAdmin
      .from('bodega_stores')
      .update({
        is_active: true,
        verified: true,
      })
      .eq('store_owner_id', id)

    if (storeError) {
      console.error('Activate stores error:', storeError)
    }

    // Send approval email (no password reset link - they already have temp password from signup)
    const emailResult = await sendStoreApprovalEmail({
      businessName: storeOwner.business_name,
      businessEmail: storeOwner.business_email,
    })

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application approved',
      emailSent: emailResult.success
    })
  } catch (error) {
    console.error('Error approving application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
