import { NextRequest, NextResponse } from 'next/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Get dashboard data for store owner
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

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    const primaryStore = stores[0]

    // Get inventory count
    const { count: inventoryCount } = await supabase
      .from('bodega_inventory')
      .select('*', { count: 'exact', head: true })
      .eq('bodega_store_id', primaryStore?.id || '')

    // Get order statistics in parallel for performance
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalOrdersResult,
      pendingOrdersResult,
      todayOrdersResult,
      recentOrdersResult
    ] = await Promise.all([
      // Total orders count
      supabase
        .from('bodega_orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_owner_id', storeOwner.id),
      // Pending orders count
      supabase
        .from('bodega_orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_owner_id', storeOwner.id)
        .in('status', ['pending', 'accepted']),
      // Today's orders with revenue
      supabase
        .from('bodega_orders')
        .select('total_amount')
        .eq('store_owner_id', storeOwner.id)
        .gte('ordered_at', today.toISOString()),
      // Recent orders (limit 5 for faster load)
      supabase
        .from('bodega_orders')
        .select('id, status, total_amount, ordered_at')
        .eq('store_owner_id', storeOwner.id)
        .order('ordered_at', { ascending: false })
        .limit(5)
    ])

    const totalOrders = totalOrdersResult.count || 0
    const pendingOrders = pendingOrdersResult.count || 0
    const todayRevenue = todayOrdersResult.data?.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0) || 0
    const orders = recentOrdersResult.data || []

    return NextResponse.json({
      success: true,
      data: {
        storeOwner,
        primaryStore,
        inventoryCount: inventoryCount || 0,
        totalOrders,
        pendingOrders,
        todayRevenue,
        recentOrders: orders || []
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
