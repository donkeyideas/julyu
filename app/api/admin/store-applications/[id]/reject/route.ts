import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreRejectionEmail } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Reject] Starting rejection process...')
    const supabaseAdmin = createServiceRoleClient() as any
    const { id } = await params
    const body = await request.json()
    const { reason } = body
    console.log('[Reject] Processing store owner ID:', id)

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

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      emailSent: emailResult.success
    })
  } catch (error) {
    console.error('Error rejecting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
