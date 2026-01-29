import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is enterprise (admin)
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.subscription_tier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServiceRoleClient()
    const { id } = params
    const body = await request.json()
    const { reason } = body

    // Update store owner status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('store_owners')
      .update({
        application_status: 'rejected',
        rejection_reason: reason || 'Application rejected',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Reject application error:', updateError)
      return NextResponse.json(
        { error: 'Failed to reject application', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Application rejected' })
  } catch (error) {
    console.error('Error rejecting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
