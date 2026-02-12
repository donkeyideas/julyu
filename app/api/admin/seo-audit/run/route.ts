import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { crawlSite } from '@/lib/seo/crawler'
import { calculateScores } from '@/lib/seo/scoring'
import { generateRecommendations } from '@/lib/seo/recommendations'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30s for crawling 9 pages

// Clamp a number to 0-100 to satisfy DB CHECK constraints
function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export async function POST(request: NextRequest) {
  const errors: string[] = []

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

    console.log('[SEO Audit] Starting audit run...')
    const startTime = Date.now()

    // Run the crawler
    const { pages, validation } = await crawlSite()
    console.log(`[SEO Audit] Crawled ${pages.length} pages in ${Date.now() - startTime}ms`)

    // Log per-page results for debugging
    pages.forEach(p => {
      console.log(`[SEO Audit] Page ${p.path}: words=${p.wordCount}, h1=${p.h1Count}, h2=${p.h2Count}, links=${p.internalLinks}, imgs=${p.imgCount}, schema=${p.jsonLdTypes.join(',')}, faq=${p.hasFaqSchema}, clarity=${p.contentClarityScore}, answer=${p.answerabilityScore}, citation=${p.citationWorthinessScore}`)
    })

    // Calculate scores
    const scores = calculateScores(pages, validation)
    console.log(`[SEO Audit] Scores: overall=${scores.overall}, tech=${scores.technical}, content=${scores.content}, schema=${scores.structuredData}, perf=${scores.performance}, geo=${scores.geo}`)

    // Generate recommendations
    const recommendations = generateRecommendations(pages, validation)
    console.log(`[SEO Audit] Generated ${recommendations.length} recommendations`)

    const auditDurationMs = Date.now() - startTime

    // Count issues by severity
    const issueCounts = {
      critical: recommendations.filter(r => r.severity === 'critical').length,
      high: recommendations.filter(r => r.severity === 'high').length,
      medium: recommendations.filter(r => r.severity === 'medium').length,
      low: recommendations.filter(r => r.severity === 'low').length,
    }

    // Generate UUID server-side to avoid .select().single() chain issues
    const auditId = randomUUID()

    // Store in Supabase (cast to any — SEO tables not in generated Database type yet)
    const supabase = createServiceRoleClient() as any

    // Build the audit row with clamped scores
    const auditRow = {
      id: auditId,
      overall_score: clamp100(scores.overall),
      technical_score: clamp100(scores.technical),
      content_score: clamp100(scores.content),
      structured_data_score: clamp100(scores.structuredData),
      performance_score: clamp100(scores.performance),
      geo_score: clamp100(scores.geo),
      total_issues: recommendations.length,
      critical_issues: issueCounts.critical,
      high_issues: issueCounts.high,
      medium_issues: issueCounts.medium,
      low_issues: issueCounts.low,
      pages_audited: pages.length,
      audit_duration_ms: auditDurationMs,
      triggered_by: sessionResult.employee?.email || 'unknown',
    }

    // Insert audit - simple insert without .select().single() chain
    console.log('[SEO Audit] Inserting audit row with id:', auditId)
    const { error: auditError } = await supabase
      .from('seo_audits')
      .insert(auditRow)

    if (auditError) {
      console.error('[SEO Audit] INSERT seo_audits FAILED:', auditError.message, auditError.code, auditError.details, auditError.hint)
      errors.push(`audit insert: ${auditError.message}`)
    } else {
      console.log(`[SEO Audit] Audit row inserted successfully, id=${auditId}`)
    }

    // Insert page scores (only if audit insert succeeded)
    if (!auditError) {
      const pageScoreRows = pages.map(page => buildPageScoreRow(auditId, page))

      console.log(`[SEO Audit] Inserting ${pageScoreRows.length} page score rows...`)
      const { error: pageError } = await supabase
        .from('seo_page_scores')
        .insert(pageScoreRows)

      if (pageError) {
        console.error('[SEO Audit] INSERT seo_page_scores FAILED:', pageError.message, pageError.code, pageError.details)
        errors.push(`page_scores insert: ${pageError.message}`)
      } else {
        console.log('[SEO Audit] Page scores inserted successfully')
      }

      // Insert recommendations
      if (recommendations.length > 0) {
        const recRows = recommendations.map(rec => ({
          audit_id: auditId,
          page_path: rec.pagePath,
          severity: rec.severity,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          current_value: rec.currentValue,
          recommended_value: rec.recommendedValue,
          estimated_impact: rec.estimatedImpact,
          is_auto_fixable: rec.isAutoFixable,
          fix_type: rec.fixType,
          is_resolved: false,
        }))

        console.log(`[SEO Audit] Inserting ${recRows.length} recommendation rows...`)
        const { error: recError } = await supabase
          .from('seo_recommendations')
          .insert(recRows)

        if (recError) {
          console.error('[SEO Audit] INSERT seo_recommendations FAILED:', recError.message, recError.code, recError.details)
          errors.push(`recommendations insert: ${recError.message}`)
        } else {
          console.log('[SEO Audit] Recommendations inserted successfully')
        }
      }
    }

    // Verify the audit was persisted by reading it back
    console.log('[SEO Audit] Verifying audit persistence...')
    const { data: verifyAudit, error: verifyError } = await supabase
      .from('seo_audits')
      .select('id, overall_score, created_at')
      .eq('id', auditId)
      .maybeSingle()

    const saved = !!(verifyAudit?.id)
    console.log(`[SEO Audit] Verification: saved=${saved}, verifyError=${verifyError?.message || 'none'}, found=${!!verifyAudit}`)

    if (!saved && !auditError) {
      errors.push('audit row not found after insert (silent failure)')
    }

    // Fetch the complete audit with joins
    let fullAudit = null
    if (saved) {
      const { data, error: fetchError } = await supabase
        .from('seo_audits')
        .select(`
          *,
          page_scores:seo_page_scores(*),
          recommendations:seo_recommendations(*)
        `)
        .eq('id', auditId)
        .single()

      if (fetchError) {
        console.error('[SEO Audit] Fetch full audit FAILED:', fetchError.message)
        errors.push(`fetch full audit: ${fetchError.message}`)
      } else {
        fullAudit = data
        console.log(`[SEO Audit] Full audit fetched: ${fullAudit?.page_scores?.length || 0} pages, ${fullAudit?.recommendations?.length || 0} recs`)
      }
    }

    const response = NextResponse.json({
      success: true,
      saved,
      audit: fullAudit || {
        ...auditRow,
        created_at: new Date().toISOString(),
        page_scores: pages.map(page => buildPageScoreRow(auditId, page)),
        recommendations: recommendations.map(rec => ({
          id: 'temp',
          audit_id: auditId,
          page_path: rec.pagePath,
          severity: rec.severity,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          current_value: rec.currentValue,
          recommended_value: rec.recommendedValue,
          estimated_impact: rec.estimatedImpact,
          is_auto_fixable: rec.isAutoFixable,
          fix_type: rec.fixType,
          is_resolved: false,
          resolved_at: null,
          created_at: new Date().toISOString(),
        })),
      },
      ...(errors.length > 0 ? { dbErrors: errors } : {}),
    })

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    console.log(`[SEO Audit] Audit complete in ${auditDurationMs}ms, saved=${saved}, errors=${errors.length}`)
    return response
  } catch (error: any) {
    console.error('[SEO Audit] Run error:', error?.message, error?.stack)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}

function buildPageScoreRow(auditId: string, page: import('@/lib/seo/types').PageAnalysis) {
  return {
    audit_id: auditId,
    page_path: page.path,
    page_url: page.url,
    overall_score: clamp100(
      (page.contentClarityScore + page.answerabilityScore + page.citationWorthinessScore) / 3
    ),
    has_title: !!page.title,
    title_length: page.titleLength,
    title_value: page.title,
    has_description: !!page.description,
    description_length: page.descriptionLength,
    description_value: page.description,
    has_og_title: !!page.ogTitle,
    has_og_description: !!page.ogDescription,
    has_og_image: !!page.ogImage,
    has_twitter_card: !!page.twitterCard,
    has_canonical: !!page.canonical,
    canonical_value: page.canonical,
    word_count: page.wordCount,
    h1_count: page.h1Count,
    h2_count: page.h2Count,
    h3_count: page.h3Count,
    h1_values: page.h1Values,
    img_count: page.imgCount,
    img_with_alt: page.imgWithAlt,
    internal_links: page.internalLinks,
    external_links: page.externalLinks,
    has_json_ld: page.hasJsonLd,
    json_ld_types: page.jsonLdTypes,
    has_faq_schema: page.hasFaqSchema,
    has_breadcrumb_schema: page.hasBreadcrumbSchema,
    has_product_schema: page.hasProductSchema,
    response_time_ms: page.responseTimeMs,
    status_code: page.statusCode,
    content_clarity_score: clamp100(page.contentClarityScore),
    answerability_score: clamp100(page.answerabilityScore),
    citation_worthiness_score: clamp100(page.citationWorthinessScore),
  }
}
