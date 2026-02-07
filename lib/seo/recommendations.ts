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

function addPageRecommendations(page: PageAnalysis, recs: SeoRecommendation[]): void {
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

  // H1 issues
  if (page.h1Count === 0) {
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

  // Low word count
  if (page.wordCount < THRESHOLDS.minWordCount && page.statusCode === 200) {
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

  // GEO recommendations
  if (page.contentClarityScore < 50) {
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

  if (page.answerabilityScore < 30 && page.path !== '/privacy' && page.path !== '/terms') {
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
}
