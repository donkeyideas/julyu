import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient() as any

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const apiFilter = searchParams.get('apiFilter') || 'all'

    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }

    // Fetch AI model usage - use select('*') to avoid column mismatch with actual DB schema
    const { data: aiData, error: aiError } = await supabase
      .from('ai_model_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (aiError) {
      console.error('[Usage API] ai_model_usage query error:', aiError.message, aiError.code)
    }

    // Fetch general API call logs
    let apiQuery = supabase
      .from('api_call_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (apiFilter !== 'all' && apiFilter !== 'ai_models') {
      apiQuery = apiQuery.eq('api_name', apiFilter)
    }

    const { data: apiData, error: apiError } = await apiQuery

    if (apiError) {
      console.error('[Usage API] api_call_logs query error:', apiError.message, apiError.code)
    }

    // Get unique API names for filter dropdown
    const { data: apiNames } = await supabase
      .from('api_call_logs')
      .select('api_name')
      .gte('created_at', startDate.toISOString())

    console.log(`[Usage API] Results: aiData=${(aiData || []).length} rows, apiData=${(apiData || []).length} rows, aiError=${aiError?.message || 'none'}, apiError=${apiError?.message || 'none'}`)

    return NextResponse.json({
      success: true,
      aiData: aiData || [],
      apiData: apiData || [],
      apiNames: apiNames || [],
      debug: {
        aiError: aiError?.message || null,
        apiError: apiError?.message || null,
        aiCount: (aiData || []).length,
        apiCount: (apiData || []).length,
      },
    })
  } catch (error) {
    console.error('[Usage API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
