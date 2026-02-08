import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List all bodega orders
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient() as any

    const { data: orders, error } = await supabase
      .from('bodega_orders')
      .select('*')
      .order('ordered_at', { ascending: false })

    if (error) {
      console.error('[Bodega Orders] Query error:', error)
      return NextResponse.json({
        error: 'Failed to fetch orders',
        details: error.message,
        orders: []
      }, { status: 500 })
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0
    })

  } catch (error) {
    console.error('[Bodega Orders] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      orders: []
    }, { status: 500 })
  }
}
