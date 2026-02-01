import { NextRequest, NextResponse } from 'next/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

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

    // Get orders statistics
    const { data: orders } = await supabase
      .from('bodega_orders')
      .select('id, status, total_amount, ordered_at')
      .eq('store_owner_id', storeOwner.id)
      .order('ordered_at', { ascending: false })
      .limit(10)

    const totalOrders = orders?.length || 0
    const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'accepted').length || 0
    const todayRevenue = orders?.reduce((sum: number, o: any) => {
      const orderDate = new Date(o.ordered_at)
      const today = new Date()
      if (orderDate.toDateString() === today.toDateString()) {
        return sum + parseFloat(o.total_amount)
      }
      return sum
    }, 0) || 0

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
