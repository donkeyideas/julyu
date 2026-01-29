import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Fetch all store applications with store owner and store details
    const { data: applications, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        *,
        bodega_stores(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch applications error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Error loading applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
