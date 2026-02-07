import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'

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
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const { data: history, error } = await supabase
      .from('seo_audits')
      .select('id, created_at, overall_score, technical_score, content_score, structured_data_score, performance_score, geo_score, total_issues, pages_audited')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[SEO Audit] History error:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({ success: true, history: history || [] })
  } catch (error) {
    console.error('[SEO Audit] History error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
