import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'

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

    // Get specific audit
    const auditId = searchParams.get('audit_id')
    if (auditId) {
      const { data: audit, error } = await supabase
        .from('seo_audits')
        .select(`
          *,
          page_scores:seo_page_scores(*),
          recommendations:seo_recommendations(*)
        `)
        .eq('id', auditId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, audit })
    }

    // Get latest audit
    const latest = searchParams.get('latest')
    if (latest === 'true') {
      const { data: audit, error } = await supabase
        .from('seo_audits')
        .select(`
          *,
          page_scores:seo_page_scores(*),
          recommendations:seo_recommendations(*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return NextResponse.json({ success: true, audit: null })
      }

      return NextResponse.json({ success: true, audit })
    }

    // Default: list recent audits (summary only)
    const { data: audits, error } = await supabase
      .from('seo_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[SEO Audit] List error:', error)
      return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 })
    }

    return NextResponse.json({ success: true, audits })
  } catch (error) {
    console.error('[SEO Audit] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
