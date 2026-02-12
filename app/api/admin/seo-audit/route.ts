import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'

export const dynamic = 'force-dynamic'

function noCacheResponse(data: object, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return noCacheResponse({ error: 'Unauthorized' }, 401)
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return noCacheResponse({ error: 'Invalid session' }, 401)
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
        console.error('[SEO Audit GET] Fetch by id error:', error.message)
        return noCacheResponse({ error: 'Audit not found' }, 404)
      }

      return noCacheResponse({ success: true, audit })
    }

    // Get latest audit - two-step query to avoid ordering issues with joins
    const latest = searchParams.get('latest')
    if (latest === 'true') {
      // Step 1: Get the latest audit ID using array result (avoid .maybeSingle() which alters PostgREST behavior)
      const { data: rows, error: latestError } = await supabase
        .from('seo_audits')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1)

      if (latestError) {
        console.log('[SEO Audit GET] Latest ID query error:', latestError.message, latestError.code)
        return noCacheResponse({ success: true, audit: null })
      }

      const latestRow = rows?.[0] || null

      if (!latestRow) {
        return noCacheResponse({ success: true, audit: null })
      }

      console.log(`[SEO Audit GET] Latest audit ID: ${latestRow.id}, created: ${latestRow.created_at}`)

      // Step 2: Fetch full audit with joins by specific ID
      const { data: audit, error } = await supabase
        .from('seo_audits')
        .select(`
          *,
          page_scores:seo_page_scores(*),
          recommendations:seo_recommendations(*)
        `)
        .eq('id', latestRow.id)
        .single()

      if (error) {
        console.error('[SEO Audit GET] Fetch by latest id error:', error.message, error.code)
        return noCacheResponse({ success: true, audit: null })
      }

      console.log(`[SEO Audit GET] Latest audit: id=${audit.id}, created=${audit.created_at}, score=${audit.overall_score}, pages=${audit.page_scores?.length || 0}`)
      return noCacheResponse({ success: true, audit })
    }

    // Default: list recent audits (summary only)
    const { data: audits, error } = await supabase
      .from('seo_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[SEO Audit GET] List error:', error)
      return noCacheResponse({ error: 'Failed to fetch audits' }, 500)
    }

    return noCacheResponse({ success: true, audits })
  } catch (error) {
    console.error('[SEO Audit GET] Error:', error)
    return noCacheResponse({ error: 'Internal server error' }, 500)
  }
}
