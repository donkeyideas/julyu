import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreRejectionEmail } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = params
    const body = await request.json()
    const { reason } = body

    // Get store owner details first
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('business_name, business_email')
      .eq('id', id)
      .single()

    if (fetchError || !storeOwner) {
      console.error('Fetch store owner error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Update store owner status to rejected
    const rejectionReason = reason || 'Application rejected'
    const { error: updateError } = await supabaseAdmin
      .from('store_owners')
      .update({
        application_status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Reject application error:', updateError)
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
