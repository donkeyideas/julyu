export interface PageAnalysis {
  path: string
  url: string
  statusCode: number
  responseTimeMs: number

  // Meta tags
  title: string | null
  titleLength: number
  description: string | null
  descriptionLength: number
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  twitterCard: string | null
  canonical: string | null
  viewport: boolean

  // Content
  wordCount: number
  h1Count: number
  h2Count: number
  h3Count: number
  h1Values: string[]
  imgCount: number
  imgWithAlt: number
  internalLinks: number
  externalLinks: number

  // Structured data
  hasJsonLd: boolean
  jsonLdTypes: string[]
  hasFaqSchema: boolean
  hasBreadcrumbSchema: boolean
  hasProductSchema: boolean

  // GEO scores
  contentClarityScore: number
  answerabilityScore: number
  citationWorthinessScore: number
}

export interface SiteValidation {
  robotsTxtValid: boolean
  sitemapPageCount: number
  sitemapMissingPages: string[]
  ogImageExists: boolean
  manifestExists: boolean
}

export interface SeoScores {
  overall: number
  technical: number
  content: number
  structuredData: number
  performance: number
  geo: number
}

export interface SeoRecommendation {
  pagePath: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'technical' | 'content' | 'structured_data' | 'performance' | 'geo'
  title: string
  description: string
  currentValue: string | null
  recommendedValue: string | null
  estimatedImpact: 'high' | 'medium' | 'low'
  isAutoFixable: boolean
  fixType: string | null
}

export interface AuditResult {
  scores: SeoScores
  pages: PageAnalysis[]
  validation: SiteValidation
  recommendations: SeoRecommendation[]
  pagesAudited: number
  auditDurationMs: number
}

export interface StoredAudit {
  id: string
  overall_score: number
  technical_score: number
  content_score: number
  structured_data_score: number
  performance_score: number
  geo_score: number
  total_issues: number
  critical_issues: number
  high_issues: number
  medium_issues: number
  low_issues: number
  pages_audited: number
  audit_duration_ms: number
  triggered_by: string
  created_at: string
  page_scores?: StoredPageScore[]
  recommendations?: StoredRecommendation[]
}

export interface StoredPageScore {
  id: string
  audit_id: string
  page_path: string
  page_url: string
  overall_score: number
  has_title: boolean
  title_length: number | null
  title_value: string | null
  has_description: boolean
  description_length: number | null
  description_value: string | null
  has_og_title: boolean
  has_og_description: boolean
  has_og_image: boolean
  has_twitter_card: boolean
  has_canonical: boolean
  canonical_value: string | null
  word_count: number
  h1_count: number
  h2_count: number
  h3_count: number
  h1_values: string[]
  img_count: number
  img_with_alt: number
  internal_links: number
  external_links: number
  has_json_ld: boolean
  json_ld_types: string[]
  has_faq_schema: boolean
  has_breadcrumb_schema: boolean
  has_product_schema: boolean
  response_time_ms: number | null
  status_code: number | null
  content_clarity_score: number | null
  answerability_score: number | null
  citation_worthiness_score: number | null
  created_at: string
}

export interface StoredRecommendation {
  id: string
  audit_id: string
  page_path: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'technical' | 'content' | 'structured_data' | 'performance' | 'geo'
  title: string
  description: string
  current_value: string | null
  recommended_value: string | null
  estimated_impact: 'high' | 'medium' | 'low'
  is_auto_fixable: boolean
  fix_type: string | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export interface SearchConsoleRow {
  date: string
  page_path: string | null
  query: string | null
  clicks: number
  impressions: number
  ctr: number
  position: number
  country: string | null
  device: string | null
}
