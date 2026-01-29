import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient()

    // Check store owners
    const { data: owners, error: ownersError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name, application_status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check bodega stores
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('bodega_stores')
      .select('id, name, store_owner_id, is_active, verified')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      owners: owners || [],
      ownersError,
      ownersCount: owners?.length || 0,
      stores: stores || [],
      storesError,
      storesCount: stores?.length || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
