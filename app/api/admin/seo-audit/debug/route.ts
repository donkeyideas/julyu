import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { analyzeHtml } from '@/lib/seo/analyzer'

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

    const { searchParams } = new URL(request.url)
    const testPath = searchParams.get('path') || '/about'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'
    const testUrl = `${baseUrl}${testPath}`

    const results: Record<string, unknown> = {
      baseUrl,
      testPath,
      testUrl,
      timestamp: new Date().toISOString(),
    }

    // 1. Fetch the page
    const startTime = Date.now()
    try {
      const response = await fetch(testUrl, {
        headers: {
          'User-Agent': 'JulyuSEOAuditor/1.0',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      })

      const responseTimeMs = Date.now() - startTime
      const html = await response.text()

      results.fetch = {
        status: response.status,
        statusText: response.statusText,
        htmlLength: html.length,
        responseTimeMs,
        contentType: response.headers.get('content-type'),
        htmlFirst500: html.substring(0, 500),
        htmlLast200: html.substring(Math.max(0, html.length - 200)),
        hasDoctype: html.toLowerCase().startsWith('<!doctype'),
        hasHtml: /<html[\s>]/i.test(html),
        hasHead: /<head[\s>]/i.test(html),
        hasBody: /<body[\s>]/i.test(html),
        hasH1: /<h1[\s>]/i.test(html),
        h1Count: (html.match(/<h1[\s>]/gi) || []).length,
        h2Count: (html.match(/<h2[\s>]/gi) || []).length,
        scriptCount: (html.match(/<script[\s>]/gi) || []).length,
        jsonLdCount: (html.match(/application\/ld\+json/gi) || []).length,
      }

      // 2. Run analyzer
      const analysis = analyzeHtml(html, testPath, testUrl, response.status, responseTimeMs)
      results.analysis = analysis

    } catch (fetchError: any) {
      results.fetch = {
        error: fetchError.message,
        responseTimeMs: Date.now() - startTime,
      }
    }

    // 3. Check DB tables
    const supabase = await createServiceRoleClient() as any

    const { count: auditCount, error: countError } = await supabase
      .from('seo_audits')
      .select('*', { count: 'exact', head: true })

    results.db = {
      auditCount: auditCount || 0,
      countError: countError?.message || null,
    }

    // Get latest audit summary
    const { data: latestAudit, error: latestError } = await supabase
      .from('seo_audits')
      .select('id, overall_score, created_at, pages_audited')
      .order('created_at', { ascending: false })
      .limit(3)

    results.latestAudits = latestAudit || []
    if (latestError) {
      results.latestAuditsError = latestError.message
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
