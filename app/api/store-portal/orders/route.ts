import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Get all orders for store owner
export async function GET(request: NextRequest) {
  try {
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get orders for this store owner
    const { data: orders, error: ordersError } = await supabase
      .from('bodega_orders')
      .select('*')
      .eq('store_owner_id', storeOwner.id)
      .order('ordered_at', { ascending: false })

    if (ordersError) {
      console.error('Fetch orders error:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: orders || []
    })

  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
