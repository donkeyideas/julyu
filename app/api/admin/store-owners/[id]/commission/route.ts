import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
    const { commission_rate } = body

    if (typeof commission_rate !== 'number' || commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json(
        { error: 'Invalid commission rate. Must be between 0 and 100.' },
        { status: 400 }
      )
    }

    // Update commission rate
    const { data: updated, error: updateError } = await supabase
      .from('store_owners')
      .update({
        commission_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update commission error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update commission rate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Commission rate updated successfully',
      data: updated,
    })

  } catch (error) {
    console.error('Update commission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
