import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('[Admin Store Applications] ====== FETCHING APPLICATIONS ======')
  console.log('[Admin Store Applications] Timestamp:', new Date().toISOString())

  try {
    // Check environment configuration
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Admin Store Applications] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json(
        { error: 'Server configuration error - service role key missing', applications: [] },
        { status: 500 }
      )
    }

    let supabaseAdmin: any
    try {
      supabaseAdmin = createServiceRoleClient() as any
      console.log('[Admin Store Applications] Service role client created successfully')
    } catch (clientError) {
      console.error('[Admin Store Applications] Failed to create service role client:', clientError)
      return NextResponse.json(
        { error: 'Database connection failed', details: clientError instanceof Error ? clientError.message : 'Unknown', applications: [] },
        { status: 500 }
      )
    }

    // Fetch all store applications with store owner and store details
    const { data: applications, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        *,
        bodega_stores(*)
      `)
      .order('created_at', { ascending: false })

    console.log('[Admin Store Applications] Query result:', {
      count: applications?.length || 0,
      error: error?.message || null,
      applicationIds: applications?.map((a: any) => ({ id: a.id, status: a.application_status, name: a.business_name })) || []
    })

    if (error) {
      console.error('[Admin Store Applications] Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      )
    }

    console.log('[Admin Store Applications] Returning', applications?.length || 0, 'applications')
    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('[Admin Store Applications] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
