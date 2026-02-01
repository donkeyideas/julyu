import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

function log(action: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[Store Detail ${action}] ${timestamp} - ${message}`, data ? JSON.stringify(data) : '')
}

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createServiceRoleClient() as any
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  log('GET', `Fetching store details for ID: ${id}`)

  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Get store owner details
    const { data: storeOwner, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        *,
        bodega_stores (*)
      `)
      .eq('id', id)
      .single()

    if (error || !storeOwner) {
      log('GET', 'Store not found', { id, error: error?.message })
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get recent orders for this store
    const { data: recentOrders } = await supabaseAdmin
      .from('bodega_orders')
      .select('*')
      .eq('store_owner_id', id)
      .order('ordered_at', { ascending: false })
      .limit(10)

    // Get inventory count
    const storeIds = storeOwner.bodega_stores?.map((s: any) => s.id) || []
    let inventoryCount = 0

    if (storeIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('bodega_inventory')
        .select('*', { count: 'exact', head: true })
        .in('bodega_store_id', storeIds)

      inventoryCount = count || 0
    }

    log('GET', 'Store found', {
      id,
      name: storeOwner.business_name,
      ordersCount: recentOrders?.length || 0,
      inventoryCount
    })

    return NextResponse.json({
      storeOwner,
      orders: recentOrders || [],
      inventoryCount
    })

  } catch (error) {
    log('GET', 'Critical error', error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
