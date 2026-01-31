import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreRejectionEmail } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Reject] ====== REJECTION PROCESS STARTED ======')
  console.log('[Reject] Timestamp:', new Date().toISOString())

  try {
    // Validate environment
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Reject] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    let supabaseAdmin: any
    try {
      supabaseAdmin = createServiceRoleClient() as any
    } catch (clientError) {
      console.error('[Reject] Failed to create service role client:', clientError)
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DB_CLIENT_ERROR' },
        { status: 500 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body
    console.log('[Reject] Processing store owner ID:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Store owner ID is required', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

    // Get store owner details first
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('business_name, business_email, application_status')
      .eq('id', id)
      .single()

    console.log('[Reject] Fetch result:', {
      found: !!storeOwner,
      currentStatus: storeOwner?.application_status,
      error: fetchError?.message
    })

    if (fetchError || !storeOwner) {
      console.error('[Reject] Fetch store owner error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Update store owner status to rejected
    const rejectionReason = reason || 'Application rejected'
    console.log('[Reject] Updating status to rejected...')
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('store_owners')
      .update({
        application_status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', id)
      .select('application_status')

    console.log('[Reject] Update result:', {
      success: !updateError,
      newStatus: updateData?.[0]?.application_status,
      error: updateError?.message
    })

    if (updateError) {
      console.error('[Reject] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject application', details: updateError.message },
        { status: 500 }
      )
    }

    // Send rejection email
    const emailResult = await sendStoreRejectionEmail({
      businessName: storeOwner.business_name,
      businessEmail: storeOwner.business_email,
      reason: rejectionReason,
    })

    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error)
      // Don't fail the entire request if email fails
    }

    // Verify the update actually persisted
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('store_owners')
      .select('application_status, rejection_reason')
      .eq('id', id)
      .single()

    if (verifyError || verifyData?.application_status !== 'rejected') {
      console.error('[Reject] VERIFICATION FAILED: Update may not have persisted')
      console.error('[Reject] Verify error:', verifyError)
      console.error('[Reject] Current status:', verifyData?.application_status)
      return NextResponse.json(
        { error: 'Rejection may not have been saved properly. Please try again.', code: 'VERIFY_FAILED' },
        { status: 500 }
      )
    }

    console.log('[Reject] ====== REJECTION SUCCESSFUL ======')
    console.log('[Reject] Final status:', verifyData.application_status)

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
      emailSent: emailResult.success,
      data: {
        status: verifyData.application_status,
        reason: verifyData.rejection_reason
      }
    })
  } catch (error) {
    console.error('[Reject] ====== CRITICAL ERROR ======')
    console.error('[Reject] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Reject] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Reject] Full error:', error)

    return NextResponse.json(
      {
        error: 'Failed to reject application due to an internal error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
