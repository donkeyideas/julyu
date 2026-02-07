import type { PageAnalysis, SiteValidation, SeoScores } from './types'
import { SCORING_WEIGHTS, THRESHOLDS, PUBLIC_PAGES } from './constants'

export function calculateScores(pages: PageAnalysis[], validation: SiteValidation): SeoScores {
  const technical = calculateTechnicalScore(pages, validation)
  const content = calculateContentScore(pages)
  const structuredData = calculateStructuredDataScore(pages)
  const performance = calculatePerformanceScore(pages)
  const geo = calculateGeoScore(pages)

  const overall = Math.round(
    technical * SCORING_WEIGHTS.technical +
    content * SCORING_WEIGHTS.content +
    structuredData * SCORING_WEIGHTS.structuredData +
    performance * SCORING_WEIGHTS.performance +
    geo * SCORING_WEIGHTS.geo
  )

  return { overall, technical, content, structuredData, performance, geo }
}

function calculateTechnicalScore(pages: PageAnalysis[], validation: SiteValidation): number {
  const total = pages.length
  if (total === 0) return 0

  let score = 0

  // robots.txt valid (10 points)
  if (validation.robotsTxtValid) score += 10

  // Sitemap completeness (15 points)
  const sitemapCoverage = validation.sitemapPageCount / PUBLIC_PAGES.length
  score += Math.round(sitemapCoverage * 15)

  // All pages have canonical (10 points)
  const pagesWithCanonical = pages.filter(p => p.canonical).length
  score += Math.round((pagesWithCanonical / total) * 10)

  // All pages respond 200 (15 points)
  const pagesOk = pages.filter(p => p.statusCode === 200).length
  score += Math.round((pagesOk / total) * 15)

  // Viewport meta on all pages (10 points)
  const pagesWithViewport = pages.filter(p => p.viewport).length
  score += Math.round((pagesWithViewport / total) * 10)

  // OG image exists (10 points)
  if (validation.ogImageExists) score += 10

  // Manifest exists (10 points)
  if (validation.manifestExists) score += 10

  // Pages have OG tags (10 points)
  const pagesWithOg = pages.filter(p => p.ogTitle && p.ogDescription).length
  score += Math.round((pagesWithOg / total) * 10)

  // No missing sitemap pages (10 points)
  if (validation.sitemapMissingPages.length === 0) score += 10

  return Math.min(100, score)
}

function calculateContentScore(pages: PageAnalysis[]): number {
  const total = pages.length
  if (total === 0) return 0

  let score = 0

  // All pages have title (15 points)
  const pagesWithTitle = pages.filter(p => p.title).length
  score += Math.round((pagesWithTitle / total) * 15)

  // Title length 30-60 chars (10 points)
  const goodTitles = pages.filter(p =>
    p.titleLength >= THRESHOLDS.titleMinLength && p.titleLength <= THRESHOLDS.titleMaxLength
  ).length
  score += Math.round((goodTitles / total) * 10)

  // All pages have meta description (15 points)
  const pagesWithDesc = pages.filter(p => p.description).length
  score += Math.round((pagesWithDesc / total) * 15)

  // Description length 120-160 chars (10 points)
  const goodDescs = pages.filter(p =>
    p.descriptionLength >= THRESHOLDS.descriptionMinLength && p.descriptionLength <= THRESHOLDS.descriptionMaxLength
  ).length
  score += Math.round((goodDescs / total) * 10)

  // Proper H1 - exactly 1 per page (15 points)
  const pagesWithSingleH1 = pages.filter(p => p.h1Count === 1).length
  score += Math.round((pagesWithSingleH1 / total) * 15)

  // Valid heading hierarchy (10 points)
  const pagesValidHierarchy = pages.filter(p => p.h1Count >= 1 && p.h2Count >= 1).length
  score += Math.round((pagesValidHierarchy / total) * 10)

  // Content length >= 300 words (10 points)
  const pagesWithContent = pages.filter(p => p.wordCount >= THRESHOLDS.minWordCount).length
  score += Math.round((pagesWithContent / total) * 10)

  // All images have alt text (15 points)
  const totalImages = pages.reduce((sum, p) => sum + p.imgCount, 0)
  const imagesWithAlt = pages.reduce((sum, p) => sum + p.imgWithAlt, 0)
  if (totalImages === 0) {
    score += 15 // No images = no alt text issue
  } else {
    score += Math.round((imagesWithAlt / totalImages) * 15)
  }

  return Math.min(100, score)
}

function calculateStructuredDataScore(pages: PageAnalysis[]): number {
  const total = pages.length
  if (total === 0) return 0

  let score = 0

  // JSON-LD present on homepage (20 points)
  const homepage = pages.find(p => p.path === '/')
  if (homepage?.hasJsonLd) score += 20

  // Organization schema (15 points)
  const hasOrg = pages.some(p => p.jsonLdTypes.includes('Organization'))
  if (hasOrg) score += 15

  // WebSite schema with search (15 points)
  const hasWebsite = pages.some(p => p.jsonLdTypes.includes('WebSite'))
  if (hasWebsite) score += 15

  // Per-page schemas present (20 points)
  const pagesWithSchema = pages.filter(p => p.hasJsonLd).length
  score += Math.round((pagesWithSchema / total) * 20)

  // FAQ schema on relevant pages (15 points)
  const hasFaq = pages.some(p => p.hasFaqSchema)
  if (hasFaq) score += 15

  // Breadcrumb schema (15 points)
  const hasBreadcrumb = pages.some(p => p.hasBreadcrumbSchema)
  if (hasBreadcrumb) score += 15

  return Math.min(100, score)
}

function calculatePerformanceScore(pages: PageAnalysis[]): number {
  const total = pages.length
  if (total === 0) return 0

  let score = 0

  // Average response time < 500ms (40 points)
  const avgResponseTime = pages.reduce((sum, p) => sum + p.responseTimeMs, 0) / total
  if (avgResponseTime < 200) score += 40
  else if (avgResponseTime < 500) score += 30
  else if (avgResponseTime < 1000) score += 20
  else if (avgResponseTime < 2000) score += 10

  // All pages 200 status (30 points)
  const pagesOk = pages.filter(p => p.statusCode === 200).length
  score += Math.round((pagesOk / total) * 30)

  // Low response time consistency (30 points)
  const pagesUnder500 = pages.filter(p => p.responseTimeMs < THRESHOLDS.maxResponseTimeMs).length
  score += Math.round((pagesUnder500 / total) * 30)

  return Math.min(100, score)
}

function calculateGeoScore(pages: PageAnalysis[]): number {
  const total = pages.length
  if (total === 0) return 0

  let score = 0

  // Structured data coverage (20 points)
  const pagesWithSchema = pages.filter(p => p.hasJsonLd).length
  score += Math.round((pagesWithSchema / total) * 20)

  // Average content clarity (20 points)
  const avgClarity = pages.reduce((sum, p) => sum + p.contentClarityScore, 0) / total
  score += Math.round((avgClarity / 100) * 20)

  // Average answerability (20 points)
  const avgAnswerability = pages.reduce((sum, p) => sum + p.answerabilityScore, 0) / total
  score += Math.round((avgAnswerability / 100) * 20)

  // Average citation worthiness (20 points)
  const avgCitation = pages.reduce((sum, p) => sum + p.citationWorthinessScore, 0) / total
  score += Math.round((avgCitation / 100) * 20)

  // Schema completeness (20 points)
  const allTypes = new Set(pages.flatMap(p => p.jsonLdTypes))
  const desiredTypes = ['WebApplication', 'Organization', 'WebSite', 'FAQPage', 'BreadcrumbList', 'Product']
  const coverage = desiredTypes.filter(t => allTypes.has(t)).length / desiredTypes.length
  score += Math.round(coverage * 20)

  return Math.min(100, score)
}
