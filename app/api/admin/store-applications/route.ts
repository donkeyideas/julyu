import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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
