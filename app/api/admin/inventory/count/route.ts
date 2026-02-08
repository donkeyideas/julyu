import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Get total inventory count
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient() as any

    const { count, error } = await supabase
      .from('bodega_inventory')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[Inventory Count] Query error:', error)
      return NextResponse.json({
        error: 'Failed to fetch inventory count',
        details: error.message,
        count: 0
      }, { status: 500 })
    }

    return NextResponse.json({
      count: count || 0
    })

  } catch (error) {
    console.error('[Inventory Count] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    }, { status: 500 })
  }
}
