import * as cheerio from 'cheerio'
import type { PageAnalysis } from './types'

export function analyzeHtml(html: string, path: string, url: string, statusCode: number, responseTimeMs: number): PageAnalysis {
  const $ = cheerio.load(html)

  // Meta tags
  const title = $('title').first().text() || null
  const description = $('meta[name="description"]').attr('content') || null
  const ogTitle = $('meta[property="og:title"]').attr('content') || null
  const ogDescription = $('meta[property="og:description"]').attr('content') || null
  const ogImage = $('meta[property="og:image"]').attr('content') || null
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || null
  const canonical = $('link[rel="canonical"]').attr('href') || null
  const viewport = !!$('meta[name="viewport"]').length

  // Headings
  const h1Values: string[] = []
  $('h1').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h1Values.push(text)
  })
  const h1Count = h1Values.length
  const h2Count = $('h2').length
  const h3Count = $('h3').length

  // Content - remove nav, footer, script, style, header elements for word count
  const contentClone = $.root().clone()
  contentClone.find('nav, footer, script, style, header, noscript, svg').remove()
  const bodyText = contentClone.find('body').text() || contentClone.text()
  const words = bodyText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  // Images
  let imgCount = 0
  let imgWithAlt = 0
  $('img').each((_, el) => {
    imgCount++
    const alt = $(el).attr('alt')
    if (alt && alt.trim().length > 0) imgWithAlt++
  })

  // Links
  const baseUrl = new URL(url).origin
  let internalLinks = 0
  let externalLinks = 0
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    if (href.startsWith('/') || href.startsWith(baseUrl)) {
      internalLinks++
    } else if (href.startsWith('http')) {
      externalLinks++
    }
  })

  // Structured data (JSON-LD)
  const jsonLdTypes: string[] = []
  let hasFaqSchema = false
  let hasBreadcrumbSchema = false
  let hasProductSchema = false
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      extractSchemaTypes(data, jsonLdTypes)
      if (jsonLdTypes.includes('FAQPage')) hasFaqSchema = true
      if (jsonLdTypes.includes('BreadcrumbList')) hasBreadcrumbSchema = true
      if (jsonLdTypes.includes('Product')) hasProductSchema = true
    } catch {
      // Invalid JSON-LD, skip
    }
  })

  // GEO scoring
  const contentClarityScore = calculateContentClarity(bodyText, h1Values, h2Count, h3Count)
  const answerabilityScore = calculateAnswerability($, h1Values, hasFaqSchema)
  const citationWorthinessScore = calculateCitationWorthiness(bodyText)

  return {
    path,
    url,
    statusCode,
    responseTimeMs,
    title,
    titleLength: title?.length || 0,
    description,
    descriptionLength: description?.length || 0,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    canonical,
    viewport,
    wordCount,
    h1Count,
    h2Count,
    h3Count,
    h1Values,
    imgCount,
    imgWithAlt,
    internalLinks,
    externalLinks,
    hasJsonLd: jsonLdTypes.length > 0,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    hasFaqSchema,
    hasBreadcrumbSchema,
    hasProductSchema,
    contentClarityScore,
    answerabilityScore,
    citationWorthinessScore,
  }
}

function extractSchemaTypes(data: unknown, types: string[]): void {
  if (!data || typeof data !== 'object') return

  if (Array.isArray(data)) {
    data.forEach(item => extractSchemaTypes(item, types))
    return
  }

  const obj = data as Record<string, unknown>
  if (obj['@type']) {
    const schemaType = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']]
    schemaType.forEach(t => { if (typeof t === 'string') types.push(t) })
  }

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    obj['@graph'].forEach(item => extractSchemaTypes(item, types))
  }
}

function calculateContentClarity(text: string, h1Values: string[], h2Count: number, h3Count: number): number {
  let score = 0
  const words = text.split(/\s+/).filter(w => w.length > 0)

  // Has meaningful content (up to 30 points)
  if (words.length >= 100) score += 15
  if (words.length >= 300) score += 15

  // Clear heading structure (up to 30 points)
  if (h1Values.length === 1) score += 15
  if (h2Count >= 2) score += 10
  if (h3Count >= 1) score += 5

  // Sentence structure - shorter sentences are clearer (up to 20 points)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length > 0) {
    const avgWordsPerSentence = words.length / sentences.length
    if (avgWordsPerSentence <= 20) score += 20
    else if (avgWordsPerSentence <= 30) score += 10
  }

  // Has lists or structured content (up to 20 points)
  if (text.includes('•') || text.includes('✓') || text.includes('✔')) score += 10
  if (h2Count >= 3) score += 10

  return Math.min(100, score)
}

function calculateAnswerability($: cheerio.CheerioAPI, h1Values: string[], hasFaqSchema: boolean): number {
  let score = 0

  // FAQ schema present (30 points)
  if (hasFaqSchema) score += 30

  // Question-style headings (up to 30 points)
  let questionHeadings = 0
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text.endsWith('?') || text.toLowerCase().startsWith('how') ||
        text.toLowerCase().startsWith('what') || text.toLowerCase().startsWith('why') ||
        text.toLowerCase().startsWith('when') || text.toLowerCase().startsWith('where')) {
      questionHeadings++
    }
  })
  score += Math.min(30, questionHeadings * 10)

  // Direct answer patterns - sentences starting with definitions (up to 20 points)
  const bodyText = $('body').text()
  const definitionPatterns = [' is a ', ' is an ', ' are ', ' means ', ' refers to ', ' provides ']
  let definitionCount = 0
  definitionPatterns.forEach(pattern => {
    if (bodyText.toLowerCase().includes(pattern)) definitionCount++
  })
  score += Math.min(20, definitionCount * 5)

  // Numbered lists or step-by-step content (up to 20 points)
  const olCount = $('ol').length
  const hasSteps = bodyText.toLowerCase().includes('step 1') || bodyText.toLowerCase().includes('step one')
  if (olCount > 0 || hasSteps) score += 20

  return Math.min(100, score)
}

function calculateCitationWorthiness(text: string): number {
  let score = 0

  // Contains specific numbers/statistics (up to 30 points)
  const numberMatches = text.match(/\d+[%$,.]?\d*/g) || []
  score += Math.min(30, numberMatches.length * 3)

  // Contains specific data points (up to 20 points)
  const dataPatterns = ['average', 'according to', 'research', 'study', 'survey', 'report', 'data shows']
  let dataCount = 0
  dataPatterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) dataCount++
  })
  score += Math.min(20, dataCount * 5)

  // Contains authoritative claims (up to 20 points)
  const authorityPatterns = ['founded', 'established', 'certified', 'award', 'recognition', 'partner']
  let authorityCount = 0
  authorityPatterns.forEach(pattern => {
    if (text.toLowerCase().includes(pattern)) authorityCount++
  })
  score += Math.min(20, authorityCount * 5)

  // Content length factor (up to 15 points)
  const words = text.split(/\s+/).length
  if (words >= 500) score += 15
  else if (words >= 300) score += 10
  else if (words >= 100) score += 5

  // Contains quotes or specific claims (up to 15 points)
  const quoteCount = (text.match(/[""].*?[""]|[''].*?['']/g) || []).length
  score += Math.min(15, quoteCount * 5)

  return Math.min(100, score)
}
