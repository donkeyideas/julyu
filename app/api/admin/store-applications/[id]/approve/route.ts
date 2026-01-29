import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { sendStoreApprovalEmail } from '@/lib/services/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = params

    // Get store owner details first
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('business_name, business_email, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !storeOwner) {
      console.error('Fetch store owner error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Update store owner status to approved
    const { error: updateError } = await supabaseAdmin
      .from('store_owners')
      .update({
        application_status: 'approved',
        approval_date: new Date().toISOString(),
        accepts_orders: true,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Approve application error:', updateError)
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

    // Generate password reset link for store owner
    let resetPasswordLink: string | undefined
    if (storeOwner.user_id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: storeOwner.business_email,
        options: {
          redirectTo: `${appUrl}/store-portal`,
        },
      })

      if (!resetError && data?.properties?.action_link) {
        resetPasswordLink = data.properties.action_link
      }
    }

    // Send approval email
    const emailResult = await sendStoreApprovalEmail({
      businessName: storeOwner.business_name,
      businessEmail: storeOwner.business_email,
      resetPasswordLink,
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
