import { analyzeHtml } from './analyzer'
import type { PageAnalysis, SiteValidation } from './types'
import { PUBLIC_PAGES, THRESHOLDS } from './constants'

const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export async function crawlSite(): Promise<{ pages: PageAnalysis[]; validation: SiteValidation }> {
  const baseUrl = getBaseUrl()

  // Crawl all public pages in parallel
  const pageResults = await Promise.allSettled(
    PUBLIC_PAGES.map(path => crawlPage(baseUrl, path))
  )

  const pages: PageAnalysis[] = pageResults
    .filter((r): r is PromiseFulfilledResult<PageAnalysis> => r.status === 'fulfilled')
    .map(r => r.value)

  // Validate site-level resources in parallel
  const [robotsResult, sitemapResult, ogImageResult, manifestResult] = await Promise.allSettled([
    validateRobotsTxt(baseUrl),
    validateSitemap(baseUrl),
    checkResourceExists(`${baseUrl}/opengraph-image`),
    checkResourceExists(`${baseUrl}/manifest.webmanifest`),
  ])

  const robotsTxtValid = robotsResult.status === 'fulfilled' ? robotsResult.value : false
  const sitemapData = sitemapResult.status === 'fulfilled' ? sitemapResult.value : { count: 0, missing: PUBLIC_PAGES }
  const ogImageExists = ogImageResult.status === 'fulfilled' ? ogImageResult.value : false
  const manifestExists = manifestResult.status === 'fulfilled' ? manifestResult.value : false

  const validation: SiteValidation = {
    robotsTxtValid,
    sitemapPageCount: sitemapData.count,
    sitemapMissingPages: sitemapData.missing,
    ogImageExists,
    manifestExists,
  }

  return { pages, validation }
}

async function crawlPage(baseUrl: string, path: string): Promise<PageAnalysis> {
  const url = `${baseUrl}${path}`
  const startTime = Date.now()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), THRESHOLDS.fetchTimeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'JulyuSEOAuditor/1.0',
        'Accept': 'text/html',
      },
    })

    const responseTimeMs = Date.now() - startTime
    const html = await response.text()

    console.log(`[SEO Crawler] ${path}: status=${response.status}, html=${html.length} chars, time=${responseTimeMs}ms`)

    return analyzeHtml(html, path, url, response.status, responseTimeMs)
  } catch (error) {
    const responseTimeMs = Date.now() - startTime
    return {
      path,
      url,
      statusCode: 0,
      responseTimeMs,
      title: null,
      titleLength: 0,
      description: null,
      descriptionLength: 0,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      twitterCard: null,
      canonical: null,
      viewport: false,
      wordCount: 0,
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      h1Values: [],
      imgCount: 0,
      imgWithAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
      hasJsonLd: false,
      jsonLdTypes: [],
      hasFaqSchema: false,
      hasBreadcrumbSchema: false,
      hasProductSchema: false,
      contentClarityScore: 0,
      answerabilityScore: 0,
      citationWorthinessScore: 0,
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function validateRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return false
    const text = await response.text()
    const lower = text.toLowerCase()
    // Check for basic valid structure (case-insensitive)
    return lower.includes('user-agent') && lower.includes('sitemap')
  } catch {
    return false
  }
}

async function validateSitemap(baseUrl: string): Promise<{ count: number; missing: string[] }> {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { count: 0, missing: PUBLIC_PAGES }
    const text = await response.text()

    // Count URLs in sitemap
    const urlMatches = text.match(/<loc>/g) || []
    const count = urlMatches.length

    // Check which public pages are missing
    const missing = PUBLIC_PAGES.filter(page => {
      const fullUrl = `${baseUrl}${page}`
      return !text.includes(fullUrl)
    })

    return { count, missing }
  } catch {
    return { count: 0, missing: PUBLIC_PAGES }
  }
}

async function checkResourceExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
