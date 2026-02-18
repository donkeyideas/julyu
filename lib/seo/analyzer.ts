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

  // AEO scoring
  const uniqueJsonLdTypes = [...new Set(jsonLdTypes)]
  const schemaRichnessScore = calculateSchemaRichness(uniqueJsonLdTypes, html)
  const faqCoverageScore = calculateFaqCoverage(html, hasFaqSchema, bodyText)
  const directAnswerReadinessScore = calculateDirectAnswerReadiness(bodyText, html)
  const entityMarkupScore = calculateEntityMarkup(html, uniqueJsonLdTypes)
  const speakableContentScore = calculateSpeakableContent(html, bodyText)
  const aiSnippetCompatibilityScore = calculateAiSnippetCompatibility(html, bodyText, h1Values, h2Count)
  const aeoScore = Math.round(
    schemaRichnessScore * 0.20 + faqCoverageScore * 0.15 + directAnswerReadinessScore * 0.20 +
    entityMarkupScore * 0.15 + speakableContentScore * 0.10 + aiSnippetCompatibilityScore * 0.20
  )

  console.log(`[SEO Analyzer] ${path}: AEO score=${aeoScore}`)

  // CRO scoring
  const ctaResult = calculateCtaPresence(html, bodyText)
  const formResult = calculateFormAccessibility(html)
  const loadSpeedImpactScore = calculateLoadSpeedImpact(responseTimeMs)
  const trustResult = calculateTrustSignals(html, bodyText)
  const socialResult = calculateSocialProof(html, bodyText)
  const valueResult = calculateValueProposition(bodyText, h1Values)
  const mobileCroScore = calculateMobileCro(html)
  const croScore = Math.round(
    ctaResult.score * 0.20 + formResult.score * 0.10 + loadSpeedImpactScore * 0.15 +
    trustResult.score * 0.15 + socialResult.score * 0.15 + valueResult.score * 0.15 + mobileCroScore * 0.10
  )

  console.log(`[SEO Analyzer] ${path}: CRO score=${croScore}`)

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
    jsonLdTypes: uniqueJsonLdTypes,
    hasFaqSchema,
    hasBreadcrumbSchema,
    hasProductSchema,
    contentClarityScore,
    answerabilityScore,
    citationWorthinessScore,
    // AEO
    aeoScore,
    schemaRichnessScore,
    faqCoverageScore,
    directAnswerReadinessScore,
    entityMarkupScore,
    speakableContentScore,
    aiSnippetCompatibilityScore,
    // CRO
    croScore,
    ctaPresenceScore: ctaResult.score,
    formAccessibilityScore: formResult.score,
    loadSpeedImpactScore,
    trustSignalsScore: trustResult.score,
    socialProofScore: socialResult.score,
    valuePropositionScore: valueResult.score,
    mobileCroScore,
    ctaCount: ctaResult.count,
    ctaTexts: ctaResult.texts,
    formCount: formResult.formCount,
    hasTrustBadges: trustResult.hasBadges,
    hasTestimonials: socialResult.hasTestimonials,
    hasSocialProof: socialResult.hasSocialProof,
    hasValueProp: valueResult.hasValueProp,
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

// ========================
// AEO Scoring Functions
// ========================

function calculateSchemaRichness(jsonLdTypes: string[], html: string): number {
  let score = 0

  // Schema variety - 5 points per unique type, max 30
  score += Math.min(30, jsonLdTypes.length * 5)

  // Essential types present - 5 points each, max 20
  const essentialTypes = ['Organization', 'WebSite', 'FAQPage', 'BreadcrumbList']
  essentialTypes.forEach(t => {
    if (jsonLdTypes.includes(t)) score += 5
  })

  // Advanced types present - 4 points each, max 20
  const advancedTypes = ['HowTo', 'Product', 'Review', 'AggregateRating', 'SpeakableSpecification']
  advancedTypes.forEach(t => {
    if (jsonLdTypes.includes(t)) score += 4
  })

  // Schema depth - check for nested properties in JSON-LD (up to 30 points)
  const ldRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let depthScore = 0
  let ldMatch
  while ((ldMatch = ldRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(ldMatch[1])
      const depth = measureSchemaDepth(data)
      depthScore = Math.max(depthScore, depth)
    } catch { /* ignore parse errors */ }
  }
  score += Math.min(30, depthScore * 6)

  return Math.min(100, score)
}

function measureSchemaDepth(obj: unknown, depth = 0): number {
  if (!obj || typeof obj !== 'object' || depth > 5) return depth
  if (Array.isArray(obj)) {
    return Math.max(depth, ...obj.map(item => measureSchemaDepth(item, depth)))
  }
  const record = obj as Record<string, unknown>
  let maxDepth = depth
  for (const key of Object.keys(record)) {
    if (key.startsWith('@')) continue
    if (typeof record[key] === 'object' && record[key] !== null) {
      maxDepth = Math.max(maxDepth, measureSchemaDepth(record[key], depth + 1))
    } else {
      maxDepth = Math.max(maxDepth, depth + 1)
    }
  }
  return maxDepth
}

function calculateFaqCoverage(html: string, hasFaqSchema: boolean, bodyText: string): number {
  let score = 0

  // FAQPage schema present (30 points)
  if (hasFaqSchema) score += 30

  // Count Q&A pairs in FAQ schema (up to 20 points, 5 per pair max 4)
  const faqRegex = /"@type"\s*:\s*"Question"/gi
  const qCount = (html.match(faqRegex) || []).length
  score += Math.min(20, qCount * 5)

  // Question-style headings in HTML (up to 20 points)
  const headingRegex = /<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi
  let questionHeadings = 0
  let hMatch
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const text = hMatch[1].replace(/<[^>]*>/g, '').trim()
    if (text.endsWith('?')) questionHeadings++
  }
  score += Math.min(20, questionHeadings * 5)

  // Expandable/accordion patterns (up to 15 points)
  const hasDetails = /<details[\s>]/i.test(html)
  const hasAccordion = /accordion|collapsible|expandable|faq-item/i.test(html)
  if (hasDetails) score += 10
  if (hasAccordion) score += 5

  // Question word diversity (up to 15 points)
  const lower = bodyText.toLowerCase()
  const questionWords = ['how ', 'what ', 'why ', 'when ', 'where ', 'who ']
  let diversity = 0
  questionWords.forEach(q => { if (lower.includes(q)) diversity++ })
  score += Math.min(15, diversity * 3)

  return Math.min(100, score)
}

function calculateDirectAnswerReadiness(bodyText: string, html: string): number {
  let score = 0
  const lower = bodyText.toLowerCase()
  const words = bodyText.split(/\s+/).filter(w => w.length > 0)
  const first200 = words.slice(0, 200).join(' ').toLowerCase()

  // Definition sentences in first 200 words (up to 25 points)
  const defPatterns = [' is a ', ' is an ', ' is the ', ' are the ', ' refers to ', ' means ']
  let defCount = 0
  defPatterns.forEach(p => { if (first200.includes(p)) defCount++ })
  score += Math.min(25, defCount * 8)

  // Concise answer paragraphs - paragraphs with < 3 sentences (up to 25 points)
  const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim().length > 20)
  if (paragraphs.length > 0) {
    const concise = paragraphs.filter(p => {
      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 5)
      return sentences.length <= 3 && sentences.length >= 1
    })
    const ratio = concise.length / paragraphs.length
    score += Math.round(ratio * 25)
  }

  // Numbered/bulleted lists (up to 25 points)
  const hasOl = /<ol[\s>]/i.test(html)
  const hasUl = /<ul[\s>]/i.test(html)
  const hasBullets = lower.includes('•') || lower.includes('✓')
  if (hasOl) score += 10
  if (hasUl) score += 10
  if (hasBullets) score += 5

  // Summary/bold key phrases (up to 25 points)
  const boldCount = (html.match(/<(strong|b)[\s>]/gi) || []).length
  const hasSummary = lower.includes('summary') || lower.includes('in short') || lower.includes('tl;dr') || lower.includes('key takeaway')
  if (boldCount >= 3) score += 15
  else if (boldCount >= 1) score += 8
  if (hasSummary) score += 10

  return Math.min(100, score)
}

function calculateEntityMarkup(html: string, jsonLdTypes: string[]): number {
  let score = 0

  // Parse all JSON-LD to check for entity properties
  const ldRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let allSchemas: Record<string, unknown>[] = []
  let ldMatch
  while ((ldMatch = ldRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(ldMatch[1])
      if (Array.isArray(data)) allSchemas.push(...data)
      else if (data['@graph'] && Array.isArray(data['@graph'])) allSchemas.push(...data['@graph'])
      else allSchemas.push(data)
    } catch { /* ignore */ }
  }

  // Organization with full details - name, url, logo (up to 30 points)
  if (jsonLdTypes.includes('Organization')) {
    const org = allSchemas.find((s: Record<string, unknown>) => s['@type'] === 'Organization')
    if (org) {
      let orgScore = 10
      if (org['name']) orgScore += 5
      if (org['url']) orgScore += 5
      if (org['logo']) orgScore += 5
      if (org['sameAs']) orgScore += 5
      score += Math.min(30, orgScore)
    }
  }

  // Person or Author markup (up to 20 points)
  const hasAuthor = jsonLdTypes.includes('Person') || allSchemas.some((s: Record<string, unknown>) => s['author'])
  if (hasAuthor) score += 20

  // Product with details (up to 20 points)
  if (jsonLdTypes.includes('Product')) {
    const prod = allSchemas.find((s: Record<string, unknown>) => s['@type'] === 'Product')
    if (prod) {
      let prodScore = 8
      if (prod['name']) prodScore += 4
      if (prod['description']) prodScore += 4
      if (prod['offers']) prodScore += 4
      score += Math.min(20, prodScore)
    }
  }

  // Place or LocalBusiness (up to 15 points)
  const hasPlace = jsonLdTypes.includes('LocalBusiness') || jsonLdTypes.includes('Place') || jsonLdTypes.includes('Store')
  if (hasPlace) score += 15

  // @id or sameAs links (up to 15 points)
  const hasId = allSchemas.some((s: Record<string, unknown>) => s['@id'])
  const hasSameAs = allSchemas.some((s: Record<string, unknown>) => s['sameAs'])
  if (hasId) score += 8
  if (hasSameAs) score += 7

  return Math.min(100, score)
}

function calculateSpeakableContent(html: string, bodyText: string): number {
  let score = 0

  // Speakable schema present (30 points)
  if (/SpeakableSpecification/i.test(html) || /speakable/i.test(html)) score += 30

  // Short pronounceable sentences (up to 25 points)
  const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length > 0) {
    const shortSentences = sentences.filter(s => {
      const wordCount = s.trim().split(/\s+/).length
      return wordCount <= 15
    })
    const ratio = shortSentences.length / sentences.length
    score += Math.round(ratio * 25)
  }

  // Natural reading content - no code blocks, no tables dominating (up to 25 points)
  const codeBlocks = (html.match(/<code[\s>]/gi) || []).length
  const tables = (html.match(/<table[\s>]/gi) || []).length
  let naturalScore = 25
  if (codeBlocks > 3) naturalScore -= 10
  if (tables > 2) naturalScore -= 10
  score += Math.max(0, naturalScore)

  // Clear summary paragraph - first paragraph 50-150 words (up to 20 points)
  const firstParaMatch = bodyText.match(/^[\s\S]{0,200}?[.!?]/)
  if (firstParaMatch) {
    const firstWords = firstParaMatch[0].split(/\s+/).length
    if (firstWords >= 10 && firstWords <= 40) score += 20
    else if (firstWords >= 5) score += 10
  }

  return Math.min(100, score)
}

function calculateAiSnippetCompatibility(html: string, bodyText: string, h1Values: string[], h2Count: number): number {
  let score = 0

  // Concise paragraphs (up to 20 points)
  const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim().length > 20)
  if (paragraphs.length > 0) {
    const avgSentences = paragraphs.reduce((sum, p) => {
      return sum + p.split(/[.!?]+/).filter(s => s.trim().length > 5).length
    }, 0) / paragraphs.length
    if (avgSentences <= 3) score += 20
    else if (avgSentences <= 5) score += 12
  }

  // Structured data patterns - tables, definition lists (up to 20 points)
  const hasTables = /<table[\s>]/i.test(html)
  const hasDl = /<dl[\s>]/i.test(html)
  const hasLists = /<[ou]l[\s>]/i.test(html)
  if (hasTables) score += 8
  if (hasDl) score += 6
  if (hasLists) score += 6

  // Clear heading-to-content mapping (up to 20 points)
  if (h1Values.length === 1 && h2Count >= 2) score += 20
  else if (h1Values.length === 1) score += 10
  else if (h2Count >= 2) score += 8

  // Q&A patterns on same page (up to 20 points)
  const hasQuestions = /<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>/i.test(html)
  const hasAnswerAfter = hasQuestions && bodyText.length > 200
  if (hasQuestions && hasAnswerAfter) score += 20
  else if (hasQuestions) score += 10

  // Content segmentation - sections clearly delimited (up to 20 points)
  const sectionCount = (html.match(/<section[\s>]/gi) || []).length
  const articleCount = (html.match(/<article[\s>]/gi) || []).length
  const divWithId = (html.match(/<div\s+id=/gi) || []).length
  const segmentation = sectionCount + articleCount + Math.min(3, divWithId)
  score += Math.min(20, segmentation * 4)

  return Math.min(100, score)
}

// ========================
// CRO Scoring Functions
// ========================

function calculateCtaPresence(html: string, bodyText: string): { score: number; count: number; texts: string[] } {
  const ctaPatterns = /get\s+started|sign\s+up|try\s+(free|now|it|demo)|request\s+(demo|access|a\s+demo)|subscribe|join\s+(now|free|us)|apply\s+(now|to)|contact\s+us|start\s+(free|now|saving)|get\s+(early\s+)?access|buy\s+now|learn\s+more|see\s+(pricing|plans|demo)|book\s+a?\s*(call|demo|meeting)/i

  const ctaTexts: string[] = []
  let score = 0

  // Find CTA buttons and links
  const buttonRegex = /<(button|a)\s[^>]*>([\s\S]*?)<\/\1>/gi
  let match
  while ((match = buttonRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text.length > 0 && text.length < 50 && ctaPatterns.test(text)) {
      if (!ctaTexts.includes(text)) ctaTexts.push(text)
    }
  }

  const count = ctaTexts.length

  // Has at least 1 CTA (30 points)
  if (count >= 1) score += 30

  // CTA above the fold - within first 2000 chars of body (20 points)
  const topHtml = html.substring(0, 3000)
  if (ctaPatterns.test(topHtml)) score += 20

  // CTA styling - button with color classes (20 points)
  const styledCtaRegex = /<(button|a)\s[^>]*(bg-green|bg-blue|bg-primary|btn-primary|bg-gradient)[^>]*>/i
  if (styledCtaRegex.test(html)) score += 20

  // CTA specificity - not just "learn more" (15 points)
  const specificCtas = ctaTexts.filter(t => !/^learn\s+more$/i.test(t) && !/^click\s+here$/i.test(t))
  if (specificCtas.length >= 1) score += 15

  // Optimal count 2-4 (15 points)
  if (count >= 2 && count <= 4) score += 15
  else if (count === 1) score += 8
  else if (count > 4) score += 5

  return { score: Math.min(100, score), count, texts: ctaTexts.slice(0, 10) }
}

function calculateFormAccessibility(html: string): { score: number; formCount: number } {
  let score = 0
  const formCount = (html.match(/<form[\s>]/gi) || []).length

  if (formCount === 0) return { score: 0, formCount: 0 }

  // Forms present with labeled inputs (30 points)
  const labelCount = (html.match(/<label[\s>]/gi) || []).length
  const inputCount = (html.match(/<input[\s>]/gi) || []).length
  if (labelCount > 0 && inputCount > 0) score += 30
  else if (inputCount > 0) score += 15

  // Placeholders or aria-labels (25 points)
  const hasPlaceholder = /placeholder\s*=/i.test(html)
  const hasAriaLabel = /aria-label\s*=/i.test(html)
  if (hasPlaceholder || hasAriaLabel) score += 25

  // Clear submit button (20 points)
  const hasSubmit = /type\s*=\s*["']submit["']/i.test(html)
  const hasSubmitButton = /<button[^>]*>([\s\S]*?(submit|send|save|sign up|request|apply|get)[\s\S]*?)<\/button>/i.test(html)
  if (hasSubmit || hasSubmitButton) score += 20

  // Error handling indicators (15 points)
  const hasErrorHandling = /aria-invalid|role\s*=\s*["']alert["']|error-message|form-error/i.test(html)
  if (hasErrorHandling) score += 15

  // Autocomplete attributes (10 points)
  const hasAutocomplete = /autocomplete\s*=/i.test(html)
  if (hasAutocomplete) score += 10

  return { score: Math.min(100, score), formCount }
}

function calculateLoadSpeedImpact(responseTimeMs: number): number {
  if (responseTimeMs < 200) return 100
  if (responseTimeMs < 500) return 80
  if (responseTimeMs < 1000) return 60
  if (responseTimeMs < 2000) return 40
  if (responseTimeMs < 3000) return 20
  return 0
}

function calculateTrustSignals(html: string, bodyText: string): { score: number; hasBadges: boolean } {
  let score = 0
  const lower = bodyText.toLowerCase()

  // Trust-related text patterns (25 points)
  const trustPatterns = ['secure', 'encrypted', 'ssl', 'guarantee', 'money-back', 'protected', 'verified', 'safe']
  let trustCount = 0
  trustPatterns.forEach(p => { if (lower.includes(p)) trustCount++ })
  score += Math.min(25, trustCount * 6)

  // Trust badges/logos (25 points)
  const badgePatterns = /alt\s*=\s*["'][^"']*(partner|certified|badge|secure|trust|verified|award)[^"']*["']/gi
  const hasBadges = badgePatterns.test(html)
  if (hasBadges) score += 25

  // Privacy policy link (25 points)
  const hasPrivacyLink = /href\s*=\s*["'][^"']*privac[^"']*["']/i.test(html)
  if (hasPrivacyLink) score += 25

  // Contact information visible (25 points)
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(bodyText)
  const hasPhone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(bodyText)
  const hasAddress = lower.includes('address') || /\d{1,5}\s\w+\s(st|ave|rd|blvd|dr|way|ln)/i.test(bodyText)
  if (hasEmail || hasPhone || hasAddress) score += 25

  return { score: Math.min(100, score), hasBadges }
}

function calculateSocialProof(html: string, bodyText: string): { score: number; hasTestimonials: boolean; hasSocialProof: boolean } {
  let score = 0
  const lower = bodyText.toLowerCase()

  // Testimonial patterns (30 points)
  const hasBlockquote = /<blockquote[\s>]/i.test(html)
  const hasQuotedText = /[""\u201C][^""\u201D]{20,}[""\u201D]/i.test(bodyText)
  const hasTestimonialClass = /testimonial|review-quote|customer-quote/i.test(html)
  const hasTestimonials = hasBlockquote || hasQuotedText || hasTestimonialClass
  if (hasTestimonials) score += 30

  // User/customer count mentions (25 points)
  const hasUserCount = /\d[\d,]*\+?\s*(users|customers|shoppers|partners|stores|members|people|businesses)/i.test(bodyText)
  const hasTrustedBy = /trusted\s+by|used\s+by|chosen\s+by|loved\s+by/i.test(lower)
  if (hasUserCount) score += 15
  if (hasTrustedBy) score += 10

  // Rating/review patterns (25 points)
  const hasRating = /\d+\.?\d*\s*(out of|\/)\s*\d+/i.test(bodyText) || /\d+\.?\d*\s*star/i.test(lower)
  const hasReviewCount = /\d[\d,]*\+?\s*review/i.test(lower)
  if (hasRating) score += 15
  if (hasReviewCount) score += 10

  // Company/partner logos section (20 points)
  const hasLogoSection = /partner-logo|company-logo|trusted-by|as-seen|logo-grid|client-logo/i.test(html)
  const hasSocialProof = hasLogoSection || hasUserCount || hasTrustedBy
  if (hasLogoSection) score += 20

  return { score: Math.min(100, score), hasTestimonials, hasSocialProof }
}

function calculateValueProposition(bodyText: string, h1Values: string[]): { score: number; hasValueProp: boolean } {
  let score = 0
  const lower = bodyText.toLowerCase()
  const first100 = bodyText.split(/\s+/).slice(0, 100).join(' ').toLowerCase()

  // Benefit-oriented H1 (30 points)
  const benefitWords = ['save', 'compare', 'find', 'discover', 'get', 'earn', 'boost', 'grow', 'reduce', 'optimize', 'simplify', 'transform']
  const h1HasBenefit = h1Values.some(h => benefitWords.some(b => h.toLowerCase().includes(b)))
  if (h1HasBenefit) score += 30

  // Value statement in first 100 words (25 points)
  const valuePatterns = ['save', 'free', 'easy', 'fast', 'simple', 'affordable', 'best', 'compare', 'no cost', 'instant']
  let valueCount = 0
  valuePatterns.forEach(p => { if (first100.includes(p)) valueCount++ })
  score += Math.min(25, valueCount * 6)

  // Feature-benefit pairs (25 points)
  const featureBenefitPatterns = ['so you can', 'which means', 'to help you', 'allowing you', 'enabling you', 'giving you', 'helping you']
  let fbCount = 0
  featureBenefitPatterns.forEach(p => { if (lower.includes(p)) fbCount++ })
  score += Math.min(25, fbCount * 8)

  // Differentiation language (20 points)
  const diffPatterns = ['only', 'first', 'best', 'unique', 'unlike', 'exclusive', '#1', 'number one', 'leading']
  let diffCount = 0
  diffPatterns.forEach(p => { if (lower.includes(p)) diffCount++ })
  score += Math.min(20, diffCount * 5)

  const hasValueProp = score >= 30
  return { score: Math.min(100, score), hasValueProp }
}

function calculateMobileCro(html: string): number {
  let score = 0

  // Viewport meta tag (25 points)
  if (/<meta\s[^>]*name\s*=\s*["']viewport["']/i.test(html)) score += 25

  // Responsive design indicators (25 points)
  const hasTailwindResponsive = /class\s*=\s*["'][^"']*(sm:|md:|lg:|xl:)/i.test(html)
  const hasMediaQuery = /@media\s*\(/i.test(html)
  if (hasTailwindResponsive || hasMediaQuery) score += 25

  // Touch-friendly button sizes (25 points)
  const hasPaddedButtons = /class\s*=\s*["'][^"']*(px-[4-9]|py-[3-9]|p-[4-9]|btn-lg|btn-md)/i.test(html)
  const hasMinHeight = /min-h-|min-height/i.test(html)
  if (hasPaddedButtons) score += 20
  if (hasMinHeight) score += 5

  // No fixed-width overflow triggers (25 points)
  const hasFixedWidth = /style\s*=\s*["'][^"']*width\s*:\s*\d{4,}px/i.test(html)
  if (!hasFixedWidth) score += 25

  return Math.min(100, score)
}
