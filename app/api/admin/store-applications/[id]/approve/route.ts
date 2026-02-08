import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreApprovalEmail } from '@/lib/services/email'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Approve] ====== APPROVAL PROCESS STARTED ======')
  console.log('[Approve] Timestamp:', new Date().toISOString())

  try {
    // Validate environment
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Approve] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    let supabaseAdmin: any
    try {
      supabaseAdmin = createServiceRoleClient() as any
    } catch (clientError) {
      console.error('[Approve] Failed to create service role client:', clientError)
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DB_CLIENT_ERROR' },
        { status: 500 }
      )
    }

    const { id } = await params
    console.log('[Approve] Processing store owner ID:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Store owner ID is required', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

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

    // Verify the update actually persisted
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('store_owners')
      .select('application_status, accepts_orders')
      .eq('id', id)
      .single()

    if (verifyError || verifyData?.application_status !== 'approved') {
      console.error('[Approve] VERIFICATION FAILED: Update may not have persisted')
      console.error('[Approve] Verify error:', verifyError)
      console.error('[Approve] Current status:', verifyData?.application_status)
      return NextResponse.json(
        { error: 'Approval may not have been saved properly. Please try again.', code: 'VERIFY_FAILED' },
        { status: 500 }
      )
    }

    console.log('[Approve] ====== APPROVAL SUCCESSFUL ======')
    console.log('[Approve] Final status:', verifyData.application_status)

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      emailSent: emailResult.success,
      data: {
        status: verifyData.application_status,
        acceptsOrders: verifyData.accepts_orders
      }
    })
  } catch (error) {
    console.error('[Approve] ====== CRITICAL ERROR ======')
    console.error('[Approve] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Approve] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Approve] Full error:', error)

    return NextResponse.json(
      {
        error: 'Failed to approve application due to an internal error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
