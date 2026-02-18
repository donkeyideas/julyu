import type { PageAnalysis, SiteValidation, SeoRecommendation } from './types'
import { THRESHOLDS, SEVERITY_ORDER } from './constants'

export function generateRecommendations(pages: PageAnalysis[], validation: SiteValidation): SeoRecommendation[] {
  const recommendations: SeoRecommendation[] = []

  // Site-wide technical checks
  addSiteRecommendations(validation, recommendations)

  // Per-page checks
  pages.forEach(page => {
    addPageRecommendations(page, recommendations)
  })

  // Sort by severity
  recommendations.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return recommendations
}

function addSiteRecommendations(validation: SiteValidation, recs: SeoRecommendation[]): void {
  if (!validation.robotsTxtValid) {
    recs.push({
      pagePath: null,
      severity: 'critical',
      category: 'technical',
      title: 'robots.txt is missing or invalid',
      description: 'The robots.txt file is either missing or does not contain the expected structure. Search engines need this file to understand which pages to crawl.',
      currentValue: 'Missing or invalid',
      recommendedValue: 'Valid robots.txt with User-agent, Disallow, and Sitemap directives',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (validation.sitemapMissingPages.length > 0) {
    recs.push({
      pagePath: null,
      severity: 'high',
      category: 'technical',
      title: `Sitemap missing ${validation.sitemapMissingPages.length} page(s)`,
      description: `The following pages are not listed in the sitemap: ${validation.sitemapMissingPages.join(', ')}. Pages not in the sitemap may be discovered more slowly by search engines.`,
      currentValue: `${validation.sitemapMissingPages.length} pages missing`,
      recommendedValue: 'All public pages included in sitemap.xml',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (!validation.ogImageExists) {
    recs.push({
      pagePath: null,
      severity: 'high',
      category: 'technical',
      title: 'OpenGraph image not found',
      description: 'The OG image referenced in the site metadata does not exist. This causes broken social media previews when the site is shared on Facebook, Twitter, LinkedIn, etc.',
      currentValue: 'Image not found',
      recommendedValue: 'A 1200x630px branded image accessible at the OG image URL',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (!validation.manifestExists) {
    recs.push({
      pagePath: null,
      severity: 'medium',
      category: 'technical',
      title: 'Web manifest not found',
      description: 'The web manifest file referenced in the site metadata does not exist. This is needed for PWA support and installability.',
      currentValue: 'File not found',
      recommendedValue: 'A valid manifest.webmanifest with app name, icons, and theme colors',
      estimatedImpact: 'low',
      isAutoFixable: false,
      fixType: null,
    })
  }
}

// Detect if a page is likely client-rendered (very low word count but 200 status)
// Next.js client components return an HTML shell before JS hydration, so the crawler
// sees almost no content. Skip content-dependent checks for these pages.
function isLikelyClientRendered(page: PageAnalysis): boolean {
  return page.statusCode === 200 && page.wordCount < 50 && page.h1Count === 0
}

function addPageRecommendations(page: PageAnalysis, recs: SeoRecommendation[]): void {
  const clientRendered = isLikelyClientRendered(page)

  // Non-200 status
  if (page.statusCode !== 200 && page.statusCode !== 0) {
    recs.push({
      pagePath: page.path,
      severity: 'critical',
      category: 'technical',
      title: `Page returns ${page.statusCode} status`,
      description: `${page.path} returns HTTP ${page.statusCode} instead of 200. This page will not be indexed by search engines.`,
      currentValue: `HTTP ${page.statusCode}`,
      recommendedValue: 'HTTP 200',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Unreachable page
  if (page.statusCode === 0) {
    recs.push({
      pagePath: page.path,
      severity: 'critical',
      category: 'technical',
      title: 'Page is unreachable',
      description: `${page.path} could not be fetched. The page may be timing out or returning an error.`,
      currentValue: 'Unreachable',
      recommendedValue: 'Page loads successfully with HTTP 200',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Missing title
  if (!page.title) {
    recs.push({
      pagePath: page.path,
      severity: 'critical',
      category: 'content',
      title: 'Missing page title',
      description: `${page.path} has no <title> tag. Page titles are one of the most important on-page SEO factors.`,
      currentValue: 'No title',
      recommendedValue: 'A unique, descriptive title between 30-60 characters',
      estimatedImpact: 'high',
      isAutoFixable: true,
      fixType: 'add_meta_title',
    })
  } else if (page.titleLength < THRESHOLDS.titleMinLength) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'content',
      title: 'Title too short',
      description: `${page.path} title is ${page.titleLength} characters. Titles under ${THRESHOLDS.titleMinLength} characters may not effectively communicate the page's content to search engines.`,
      currentValue: `${page.titleLength} chars: "${page.title}"`,
      recommendedValue: `${THRESHOLDS.titleMinLength}-${THRESHOLDS.titleMaxLength} characters`,
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  } else if (page.titleLength > THRESHOLDS.titleMaxLength) {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'content',
      title: 'Title may be truncated',
      description: `${page.path} title is ${page.titleLength} characters. Titles over ${THRESHOLDS.titleMaxLength} characters may be truncated in search results.`,
      currentValue: `${page.titleLength} chars`,
      recommendedValue: `${THRESHOLDS.titleMinLength}-${THRESHOLDS.titleMaxLength} characters`,
      estimatedImpact: 'low',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Missing description
  if (!page.description) {
    recs.push({
      pagePath: page.path,
      severity: 'high',
      category: 'content',
      title: 'Missing meta description',
      description: `${page.path} has no meta description. Meta descriptions help search engines understand page content and appear as snippets in search results.`,
      currentValue: 'No description',
      recommendedValue: 'A unique, compelling description between 120-160 characters',
      estimatedImpact: 'high',
      isAutoFixable: true,
      fixType: 'add_meta_description',
    })
  } else if (page.descriptionLength < THRESHOLDS.descriptionMinLength) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'content',
      title: 'Meta description too short',
      description: `${page.path} description is ${page.descriptionLength} characters. Short descriptions miss the opportunity to provide context to searchers.`,
      currentValue: `${page.descriptionLength} chars`,
      recommendedValue: `${THRESHOLDS.descriptionMinLength}-${THRESHOLDS.descriptionMaxLength} characters`,
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Missing OG tags
  if (!page.ogTitle || !page.ogDescription) {
    recs.push({
      pagePath: page.path,
      severity: 'high',
      category: 'content',
      title: 'Missing OpenGraph tags',
      description: `${page.path} is missing ${!page.ogTitle ? 'og:title' : ''}${!page.ogTitle && !page.ogDescription ? ' and ' : ''}${!page.ogDescription ? 'og:description' : ''}. These are needed for proper social media sharing.`,
      currentValue: `og:title: ${page.ogTitle ? 'set' : 'missing'}, og:description: ${page.ogDescription ? 'set' : 'missing'}`,
      recommendedValue: 'Both og:title and og:description set',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // H1 issues (skip for client-rendered pages where H1 is added by JS)
  if (page.h1Count === 0 && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'high',
      category: 'content',
      title: 'Missing H1 heading',
      description: `${page.path} has no H1 heading. Every page should have exactly one H1 that describes its main topic.`,
      currentValue: '0 H1 headings',
      recommendedValue: 'Exactly 1 H1 heading',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  } else if (page.h1Count > 1) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'content',
      title: 'Multiple H1 headings',
      description: `${page.path} has ${page.h1Count} H1 headings (${page.h1Values.join(', ')}). Best practice is to have exactly one H1 per page.`,
      currentValue: `${page.h1Count} H1 headings`,
      recommendedValue: 'Exactly 1 H1 heading',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Low word count (skip for client-rendered pages where content is loaded by JS)
  if (page.wordCount < THRESHOLDS.minWordCount && page.statusCode === 200 && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'content',
      title: 'Thin content',
      description: `${page.path} has only ${page.wordCount} words. Pages with fewer than ${THRESHOLDS.minWordCount} words may be considered thin content by search engines.`,
      currentValue: `${page.wordCount} words`,
      recommendedValue: `At least ${THRESHOLDS.minWordCount} words`,
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Missing alt text
  if (page.imgCount > 0 && page.imgWithAlt < page.imgCount) {
    const missing = page.imgCount - page.imgWithAlt
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'content',
      title: `${missing} image(s) missing alt text`,
      description: `${page.path} has ${missing} out of ${page.imgCount} images without alt text. Alt text improves accessibility and helps search engines understand images.`,
      currentValue: `${page.imgWithAlt}/${page.imgCount} images have alt text`,
      recommendedValue: 'All images should have descriptive alt text',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Missing canonical
  if (!page.canonical) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'technical',
      title: 'Missing canonical URL',
      description: `${page.path} has no canonical link tag. Canonical URLs prevent duplicate content issues.`,
      currentValue: 'No canonical URL',
      recommendedValue: 'Self-referencing canonical URL',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // No structured data
  if (!page.hasJsonLd && page.path !== '/privacy' && page.path !== '/terms') {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'structured_data',
      title: 'No structured data',
      description: `${page.path} has no JSON-LD structured data. Structured data helps search engines and AI understand your content better.`,
      currentValue: 'No JSON-LD found',
      recommendedValue: 'Add relevant schema.org markup (FAQ, HowTo, Product, etc.)',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // GEO recommendations (skip for client-rendered pages)
  if (page.contentClarityScore < 50 && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'geo',
      title: 'Low content clarity for AI',
      description: `${page.path} has a content clarity score of ${page.contentClarityScore}/100. Improve by using clear headings, shorter sentences, and structured lists.`,
      currentValue: `${page.contentClarityScore}/100`,
      recommendedValue: '70+/100',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.answerabilityScore < 30 && page.path !== '/privacy' && page.path !== '/terms' && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'geo',
      title: 'Low answerability score',
      description: `${page.path} scores ${page.answerabilityScore}/100 for answerability. Add FAQ sections, question-style headings, and direct answer patterns to improve AI citation potential.`,
      currentValue: `${page.answerabilityScore}/100`,
      recommendedValue: '50+/100',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // Slow response time
  if (page.responseTimeMs > THRESHOLDS.maxResponseTimeMs) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'performance',
      title: 'Slow page response',
      description: `${page.path} took ${page.responseTimeMs}ms to respond. Pages should load under ${THRESHOLDS.maxResponseTimeMs}ms for optimal SEO and user experience.`,
      currentValue: `${page.responseTimeMs}ms`,
      recommendedValue: `Under ${THRESHOLDS.maxResponseTimeMs}ms`,
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // === AEO Recommendations ===

  if (page.speakableContentScore < 20 && !clientRendered && page.path !== '/privacy' && page.path !== '/terms') {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'aeo',
      title: 'Missing speakable content markup',
      description: `${page.path} has a speakable content score of ${page.speakableContentScore}/100. Add SpeakableSpecification schema and use short, natural sentences to improve voice assistant readiness.`,
      currentValue: `${page.speakableContentScore}/100`,
      recommendedValue: '50+/100 with SpeakableSpecification schema',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.faqCoverageScore < 30 && page.wordCount >= 300 && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'aeo',
      title: 'Low FAQ coverage for answer engines',
      description: `${page.path} has a FAQ coverage score of ${page.faqCoverageScore}/100. Add FAQPage schema with question-answer pairs to increase chances of being cited by AI answer engines.`,
      currentValue: `${page.faqCoverageScore}/100`,
      recommendedValue: '60+/100 with FAQPage schema',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.directAnswerReadinessScore < 30 && !clientRendered && page.path !== '/privacy' && page.path !== '/terms') {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'aeo',
      title: 'Poor direct answer readiness',
      description: `${page.path} scores ${page.directAnswerReadinessScore}/100 for direct answer readiness. Use definition sentences, concise answer paragraphs, and bulleted lists to help AI extract direct answers.`,
      currentValue: `${page.directAnswerReadinessScore}/100`,
      recommendedValue: '50+/100',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.schemaRichnessScore < 40 && page.hasJsonLd && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'aeo',
      title: 'Schema markup lacks depth',
      description: `${page.path} has JSON-LD but schema richness is only ${page.schemaRichnessScore}/100. Add more schema types (BreadcrumbList, HowTo, Product) and include detailed properties.`,
      currentValue: `${page.schemaRichnessScore}/100`,
      recommendedValue: '60+/100 with diverse, detailed schema types',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.entityMarkupScore < 20 && (page.path === '/' || page.path === '/about') && !clientRendered) {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'aeo',
      title: 'Missing entity markup on key page',
      description: `${page.path} has an entity markup score of ${page.entityMarkupScore}/100. Add detailed Organization, Person, or Product schema with @id and sameAs links for entity recognition.`,
      currentValue: `${page.entityMarkupScore}/100`,
      recommendedValue: '50+/100 with Organization + sameAs links',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.aiSnippetCompatibilityScore < 40 && !clientRendered && page.path !== '/privacy' && page.path !== '/terms') {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'aeo',
      title: 'Low AI snippet compatibility',
      description: `${page.path} scores ${page.aiSnippetCompatibilityScore}/100 for AI snippet compatibility. Structure content with clear headings, concise paragraphs, tables, and Q&A patterns.`,
      currentValue: `${page.aiSnippetCompatibilityScore}/100`,
      recommendedValue: '60+/100',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  // === CRO Recommendations ===

  const isLegalPage = page.path === '/privacy' || page.path === '/terms'

  if (page.ctaCount === 0 && !isLegalPage && page.path !== '/careers') {
    recs.push({
      pagePath: page.path,
      severity: 'high',
      category: 'cro',
      title: 'No call-to-action found',
      description: `${page.path} has no detectable CTA buttons. Every non-legal page should have at least one clear call-to-action to guide visitors toward conversion.`,
      currentValue: '0 CTAs',
      recommendedValue: '2-4 CTAs with action-oriented text',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  } else if (page.ctaPresenceScore < 40 && page.ctaCount > 0 && !isLegalPage) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'cro',
      title: 'CTA quality needs improvement',
      description: `${page.path} has CTAs but scores ${page.ctaPresenceScore}/100 for CTA quality. Place CTAs above the fold, use specific action-oriented text, and ensure visual contrast.`,
      currentValue: `${page.ctaPresenceScore}/100 (${page.ctaCount} CTAs)`,
      recommendedValue: '70+/100 with specific, visible CTAs',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.formCount === 0 && (page.path === '/contact' || page.path === '/for-stores')) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'cro',
      title: 'Missing form on conversion page',
      description: `${page.path} is a key conversion page but has no detectable form. Add a contact or inquiry form to capture leads directly.`,
      currentValue: '0 forms',
      recommendedValue: 'At least 1 accessible form with labeled inputs',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.trustSignalsScore < 30 && (page.path === '/' || page.path === '/pricing' || page.path === '/for-stores')) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'cro',
      title: 'Weak trust signals',
      description: `${page.path} has a trust signals score of ${page.trustSignalsScore}/100. Add trust badges, security indicators, privacy links, and visible contact information to build visitor confidence.`,
      currentValue: `${page.trustSignalsScore}/100`,
      recommendedValue: '60+/100 with visible trust indicators',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.socialProofScore < 30 && (page.path === '/' || page.path === '/pricing')) {
    recs.push({
      pagePath: page.path,
      severity: 'low',
      category: 'cro',
      title: 'Missing social proof',
      description: `${page.path} scores ${page.socialProofScore}/100 for social proof. Add testimonials, user counts, ratings, or partner logos to leverage social proof for conversions.`,
      currentValue: `${page.socialProofScore}/100`,
      recommendedValue: '50+/100 with testimonials or user counts',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.valuePropositionScore < 40 && page.path === '/') {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'cro',
      title: 'Weak value proposition on homepage',
      description: `Homepage value proposition score is ${page.valuePropositionScore}/100. Use benefit-oriented H1, clear value statements in the first 100 words, and differentiation language.`,
      currentValue: `${page.valuePropositionScore}/100`,
      recommendedValue: '70+/100 with clear benefits above the fold',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  const conversionPages = ['/', '/pricing', '/for-stores', '/contact', '/features']
  if (page.responseTimeMs > 1000 && conversionPages.includes(page.path)) {
    recs.push({
      pagePath: page.path,
      severity: 'high',
      category: 'cro',
      title: 'Slow load time hurting conversions',
      description: `${page.path} takes ${page.responseTimeMs}ms to load. On key conversion pages, every 100ms of added latency can reduce conversions by up to 7%.`,
      currentValue: `${page.responseTimeMs}ms`,
      recommendedValue: 'Under 500ms for conversion-critical pages',
      estimatedImpact: 'high',
      isAutoFixable: false,
      fixType: null,
    })
  }

  if (page.mobileCroScore < 50 && !isLegalPage) {
    recs.push({
      pagePath: page.path,
      severity: 'medium',
      category: 'cro',
      title: 'Low mobile conversion readiness',
      description: `${page.path} scores ${page.mobileCroScore}/100 for mobile CRO. Ensure viewport meta, responsive design, touch-friendly buttons, and no horizontal overflow.`,
      currentValue: `${page.mobileCroScore}/100`,
      recommendedValue: '70+/100 with mobile-optimized CTAs and layout',
      estimatedImpact: 'medium',
      isAutoFixable: false,
      fixType: null,
    })
  }
}
