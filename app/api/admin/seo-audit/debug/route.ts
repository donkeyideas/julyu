import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
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

    const supabase = createServiceRoleClient() as any
    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    }

    // 1. Count all audits
    const { count, error: countError } = await supabase
      .from('seo_audits')
      .select('*', { count: 'exact', head: true })

    results.totalAudits = count ?? 0
    if (countError) results.countError = countError.message

    // 2. List ALL audits (up to 20) ordered by created_at DESC
    const { data: allAudits, error: listError } = await supabase
      .from('seo_audits')
      .select('id, overall_score, created_at, pages_audited, triggered_by')
      .order('created_at', { ascending: false })
      .limit(20)

    results.audits = (allAudits || []).map((a: any) => ({
      id: a.id,
      score: a.overall_score,
      created_at: a.created_at,
      pages: a.pages_audited,
      triggered_by: a.triggered_by,
    }))
    if (listError) results.listError = listError.message

    // 3. For the latest audit, count its page_scores and recommendations
    if (allAudits && allAudits.length > 0) {
      const latestId = allAudits[0].id

      const { count: psCount } = await supabase
        .from('seo_page_scores')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', latestId)

      const { count: recCount } = await supabase
        .from('seo_recommendations')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', latestId)

      results.latestAuditDetails = {
        id: latestId,
        pageScoresCount: psCount ?? 0,
        recommendationsCount: recCount ?? 0,
      }
    }

    // 4. Test DB write capability
    const testId = randomUUID()
    const { error: writeError } = await supabase
      .from('seo_audits')
      .insert({
        id: testId,
        overall_score: 0,
        technical_score: 0,
        content_score: 0,
        structured_data_score: 0,
        performance_score: 0,
        geo_score: 0,
        total_issues: 0,
        pages_audited: 0,
        triggered_by: 'debug-test',
      })

    if (writeError) {
      results.writeTest = { success: false, error: writeError.message, code: writeError.code, details: writeError.details, hint: writeError.hint }
    } else {
      // Verify the write by reading it back
      const { data: readBack, error: readError } = await supabase
        .from('seo_audits')
        .select('id, created_at')
        .eq('id', testId)
        .maybeSingle()

      // Delete the test row
      await supabase.from('seo_audits').delete().eq('id', testId)

      results.writeTest = {
        success: true,
        inserted: !!readBack,
        readBackId: readBack?.id,
        readBackCreatedAt: readBack?.created_at,
        readError: readError?.message || null,
      }
    }

    const response = NextResponse.json({ success: true, results })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
