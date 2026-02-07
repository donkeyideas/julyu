import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { crawlSite } from '@/lib/seo/crawler'
import { calculateScores } from '@/lib/seo/scoring'
import { generateRecommendations } from '@/lib/seo/recommendations'

export async function POST(request: NextRequest) {
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

    const startTime = Date.now()

    // Run the crawler
    const { pages, validation } = await crawlSite()

    // Calculate scores
    const scores = calculateScores(pages, validation)

    // Generate recommendations
    const recommendations = generateRecommendations(pages, validation)

    const auditDurationMs = Date.now() - startTime

    // Count issues by severity
    const issueCounts = {
      critical: recommendations.filter(r => r.severity === 'critical').length,
      high: recommendations.filter(r => r.severity === 'high').length,
      medium: recommendations.filter(r => r.severity === 'medium').length,
      low: recommendations.filter(r => r.severity === 'low').length,
    }

    // Store in Supabase (cast to any — SEO tables not in generated Database type yet)
    const supabase = await createServiceRoleClient() as any

    // Insert audit
    const { data: audit, error: auditError } = await supabase
      .from('seo_audits')
      .insert({
        overall_score: scores.overall,
        technical_score: scores.technical,
        content_score: scores.content,
        structured_data_score: scores.structuredData,
        performance_score: scores.performance,
        geo_score: scores.geo,
        total_issues: recommendations.length,
        critical_issues: issueCounts.critical,
        high_issues: issueCounts.high,
        medium_issues: issueCounts.medium,
        low_issues: issueCounts.low,
        pages_audited: pages.length,
        audit_duration_ms: auditDurationMs,
        triggered_by: sessionResult.employee.email,
      })
      .select('id')
      .single()

    if (auditError || !audit) {
      console.error('[SEO Audit] Insert audit error:', auditError)
      return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
    }

    // Insert page scores
    const pageScoreRows = pages.map(page => ({
      audit_id: audit.id,
      page_path: page.path,
      page_url: page.url,
      overall_score: Math.round(
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
      content_clarity_score: page.contentClarityScore,
      answerability_score: page.answerabilityScore,
      citation_worthiness_score: page.citationWorthinessScore,
    }))

    const { error: pageError } = await supabase
      .from('seo_page_scores')
      .insert(pageScoreRows)

    if (pageError) {
      console.error('[SEO Audit] Insert page scores error:', pageError)
    }

    // Insert recommendations
    if (recommendations.length > 0) {
      const recRows = recommendations.map(rec => ({
        audit_id: audit.id,
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

      const { error: recError } = await supabase
        .from('seo_recommendations')
        .insert(recRows)

      if (recError) {
        console.error('[SEO Audit] Insert recommendations error:', recError)
      }
    }

    // Fetch the complete audit with page scores and recommendations
    const { data: fullAudit, error: fetchError } = await supabase
      .from('seo_audits')
      .select(`
        *,
        page_scores:seo_page_scores(*),
        recommendations:seo_recommendations(*)
      `)
      .eq('id', audit.id)
      .single()

    if (fetchError) {
      console.error('[SEO Audit] Fetch full audit error:', fetchError)
    }

    return NextResponse.json({
      success: true,
      audit: fullAudit || {
        id: audit.id,
        ...scores,
        total_issues: recommendations.length,
        ...issueCounts,
        pages_audited: pages.length,
        audit_duration_ms: auditDurationMs,
      },
    })
  } catch (error) {
    console.error('[SEO Audit] Run error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
