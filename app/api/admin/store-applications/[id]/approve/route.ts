import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createServiceRoleClient()
    const { id } = params

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

    return NextResponse.json({ success: true, message: 'Application approved' })
  } catch (error) {
    console.error('Error approving application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
