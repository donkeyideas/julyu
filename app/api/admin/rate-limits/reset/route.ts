/**
 * POST /api/admin/rate-limits/reset — Reset usage counter for an API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_name } = body

    if (!api_name || !['tesco', 'grocery-prices', 'serpapi'].includes(api_name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API name' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient() as any
    const today = new Date().toISOString().split('T')[0]

    // Delete today's usage record to reset the counter
    const { error } = await supabase
      .from('api_usage_tracking')
      .delete()
      .eq('api_name', api_name)
      .eq('date', today)

    if (error) {
      throw error
    }

    console.log(`[Rate Limits] Reset usage for ${api_name} on ${today}`)

    return NextResponse.json({
      success: true,
      message: `Usage reset for ${api_name}`,
    })
  } catch (error: any) {
    console.error('[Rate Limits] Reset error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
