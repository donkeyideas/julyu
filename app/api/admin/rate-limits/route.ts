/**
 * GET  /api/admin/rate-limits — Get rate limit configurations and usage stats
 * POST /api/admin/rate-limits — Update rate limit configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/services/rate-limiter'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get rate limit configs
    const { data: configs, error: configError } = await supabase
      .from('rate_limit_config')
      .select('*')
      .in('api_name', ['tesco', 'grocery-prices'])

    if (configError && !configError.message?.includes('relation')) {
      throw configError
    }

    // Get usage stats
    const usage = await getUsageStats()

    return NextResponse.json({
      success: true,
      configs: configs || [],
      usage,
    })
  } catch (error: any) {
    console.error('[Rate Limits] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_name, daily_limit, monthly_limit, is_enabled } = body

    if (!api_name || !['tesco', 'grocery-prices'].includes(api_name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API name' },
        { status: 400 }
      )
    }

    if (daily_limit !== undefined && (daily_limit < 0 || daily_limit > 100000)) {
      return NextResponse.json(
        { success: false, error: 'Daily limit must be between 0 and 100,000' },
        { status: 400 }
      )
    }

    if (monthly_limit !== undefined && (monthly_limit < 0 || monthly_limit > 1000000)) {
      return NextResponse.json(
        { success: false, error: 'Monthly limit must be between 0 and 1,000,000' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert rate limit config
    const { data, error } = await supabase
      .from('rate_limit_config')
      .upsert({
        api_name,
        daily_limit: daily_limit ?? 1000,
        monthly_limit: monthly_limit ?? 10000,
        is_enabled: is_enabled ?? true,
        alert_threshold_50: true,
        alert_threshold_75: true,
        alert_threshold_90: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'api_name',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      config: data,
    })
  } catch (error: any) {
    console.error('[Rate Limits] Update error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
