import * as cheerio from 'cheerio'
import type { PageAnalysis } from './types'

export function analyzeHtml(html: string, path: string, url: string, statusCode: number, responseTimeMs: number): PageAnalysis {
  console.log(`[SEO Analyzer] ${path}: starting analysis, html length=${html.length}`)

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

  console.log(`[SEO Analyzer] ${path}: title="${title}", desc length=${description?.length || 0}`)

  // === HEADINGS ===
  // Try Cheerio first
  let h1Values: string[] = []
  $('h1').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h1Values.push(text)
  })
  let h2Count = $('h2').length
  let h3Count = $('h3').length

  console.log(`[SEO Analyzer] ${path}: cheerio headings - h1=${h1Values.length}, h2=${h2Count}, h3=${h3Count}`)

  // Regex fallback for headings if Cheerio finds none
  if (h1Values.length === 0) {
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi
    let match
    while ((match = h1Regex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '').trim()
      if (text) h1Values.push(text)
    }
    if (h1Values.length > 0) {
      console.log(`[SEO Analyzer] ${path}: regex found ${h1Values.length} h1(s): ${h1Values[0].substring(0, 50)}`)
    }
  }
  if (h2Count === 0) {
    const h2Matches = html.match(/<h2[^>]*>/gi) || []
    h2Count = h2Matches.length
  }
  if (h3Count === 0) {
    const h3Matches = html.match(/<h3[^>]*>/gi) || []
    h3Count = h3Matches.length
  }
  const h1Count = h1Values.length

  // === CONTENT EXTRACTION ===
  // Strategy 1: Cheerio body extraction
  let bodyText = ''
  const bodyHtml = $('body').html() || ''
  console.log(`[SEO Analyzer] ${path}: $('body').html() length=${bodyHtml.length}`)

  if (bodyHtml.length > 0) {
    const $content = cheerio.load(bodyHtml)
    $content('nav, footer, script, style, header, noscript, svg, [data-nextjs-scroll-focus-boundary]').remove()
    bodyText = $content.text()
  }

  // If $('body').html() was empty, try $.html() (entire document)
  if (bodyHtml.length === 0 && html.length > 500) {
    console.log(`[SEO Analyzer] ${path}: body.html() empty, trying full HTML parsing`)
    const $full = cheerio.load(html)
    $full('head, nav, footer, script, style, header, noscript, svg').remove()
    bodyText = $full.text()
  }

  const cheerioWords = bodyText.split(/\s+/).filter(w => w.length > 0)
  console.log(`[SEO Analyzer] ${path}: cheerio extracted ${cheerioWords.length} words`)

  // Strategy 2: Regex fallback if Cheerio found very little
  if (cheerioWords.length < 50 && html.length > 1000) {
    console.log(`[SEO Analyzer] ${path}: cheerio found <50 words, trying regex extraction`)
    let stripped = html
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    // Remove all remaining HTML tags
    stripped = stripped.replace(/<[^>]*>/g, ' ')
    // Clean up whitespace and HTML entities
    stripped = stripped
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/&#\d+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const regexWords = stripped.split(/\s+/).filter(w => w.length > 0)
    console.log(`[SEO Analyzer] ${path}: regex extracted ${regexWords.length} words`)
    if (regexWords.length > cheerioWords.length) {
      bodyText = stripped
    }
  }

  const words = bodyText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  console.log(`[SEO Analyzer] ${path}: final word count=${wordCount}, h1=${h1Count}, h2=${h2Count}`)

  // === IMAGES ===
  let imgCount = 0
  let imgWithAlt = 0
  $('img').each((_, el) => {
    imgCount++
    const alt = $(el).attr('alt')
    if (alt && alt.trim().length > 0) imgWithAlt++
  })
  if (imgCount === 0) {
    const imgMatches = html.match(/<img\s[^>]*>/gi) || []
    imgCount = imgMatches.length
    imgWithAlt = imgMatches.filter(tag => /alt\s*=\s*["'][^"']+["']/i.test(tag)).length
  }

  // === LINKS ===
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
  if (internalLinks === 0 && externalLinks === 0) {
    const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi
    let linkMatch
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1]
      if (href.startsWith('/') || href.startsWith(baseUrl)) {
        internalLinks++
      } else if (href.startsWith('http')) {
        externalLinks++
      }
    }
  }

  // === STRUCTURED DATA (JSON-LD) ===
  const jsonLdTypes: string[] = []
  let hasFaqSchema = false
  let hasBreadcrumbSchema = false
  let hasProductSchema = false

  // Strategy 1: Cheerio
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html() || '{}'
      const data = JSON.parse(jsonText)
      extractSchemaTypes(data, jsonLdTypes)
    } catch (e) {
      console.log(`[SEO Analyzer] ${path}: JSON-LD parse error (cheerio)`)
    }
  })

  // Strategy 2: Regex fallback for JSON-LD if Cheerio found none
  if (jsonLdTypes.length === 0) {
    const ldRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let ldMatch
    while ((ldMatch = ldRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(ldMatch[1])
        extractSchemaTypes(data, jsonLdTypes)
      } catch (e) {
        console.log(`[SEO Analyzer] ${path}: JSON-LD parse error (regex)`)
      }
    }
  }

  hasFaqSchema = jsonLdTypes.includes('FAQPage')
  hasBreadcrumbSchema = jsonLdTypes.includes('BreadcrumbList')
  hasProductSchema = jsonLdTypes.includes('Product')

  console.log(`[SEO Analyzer] ${path}: schema types=[${jsonLdTypes.join(', ')}], faq=${hasFaqSchema}`)

  // GEO scoring - pass bodyText directly instead of re-extracting
  const contentClarityScore = calculateContentClarity(bodyText, h1Values, h2Count, h3Count)
  const answerabilityScore = calculateAnswerability(html, bodyText, h1Values, hasFaqSchema)
  const citationWorthinessScore = calculateCitationWorthiness(bodyText)

  console.log(`[SEO Analyzer] ${path}: GEO scores - clarity=${contentClarityScore}, answer=${answerabilityScore}, citation=${citationWorthinessScore}`)

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

function calculateAnswerability(html: string, bodyText: string, h1Values: string[], hasFaqSchema: boolean): number {
  let score = 0

  // FAQ schema present (30 points)
  if (hasFaqSchema) score += 30

  // Question-style headings (up to 30 points) - use regex on raw HTML for reliability
  let questionHeadings = 0
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
  let hMatch
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const text = hMatch[1].replace(/<[^>]*>/g, '').trim().toLowerCase()
    if (text.endsWith('?') || text.startsWith('how') || text.startsWith('what') ||
        text.startsWith('why') || text.startsWith('when') || text.startsWith('where')) {
      questionHeadings++
    }
  }
  score += Math.min(30, questionHeadings * 10)

  // Direct answer patterns - sentences starting with definitions (up to 20 points)
  const definitionPatterns = [' is a ', ' is an ', ' are ', ' means ', ' refers to ', ' provides ']
  let definitionCount = 0
  definitionPatterns.forEach(pattern => {
    if (bodyText.toLowerCase().includes(pattern)) definitionCount++
  })
  score += Math.min(20, definitionCount * 5)

  // Numbered lists or step-by-step content (up to 20 points)
  const hasOl = /<ol[\s>]/i.test(html)
  const hasSteps = bodyText.toLowerCase().includes('step 1') || bodyText.toLowerCase().includes('step one')
  if (hasOl || hasSteps) score += 20

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
  const quoteCount = (text.match(/[""\u201C].*?[""\u201D]|['\u2018'].*?['\u2019']/g) || []).length
  score += Math.min(15, quoteCount * 5)

  return Math.min(100, score)
}
