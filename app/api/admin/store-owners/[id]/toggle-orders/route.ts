import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin (enterprise tier)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.tier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { accepts_orders } = body

    if (typeof accepts_orders !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid accepts_orders value. Must be boolean.' },
        { status: 400 }
      )
    }

    // Update order acceptance
    const { data: updated, error: updateError } = await supabase
      .from('store_owners')
      .update({
        accepts_orders,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update order acceptance error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order acceptance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Order acceptance ${accepts_orders ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    })

  } catch (error) {
    console.error('Update order acceptance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
