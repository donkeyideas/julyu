import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient() as any

    // Fetch all store owners with their bodega stores
    const { data: stores, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        *,
        bodega_stores (
          id,
          name,
          city,
          state,
          zip,
          is_active,
          verified
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch stores error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stores', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ stores: stores || [] })
  } catch (error) {
    console.error('Error loading stores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
