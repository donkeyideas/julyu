export const PUBLIC_PAGES = [
  '/',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/careers',
  '/privacy',
  '/terms',
  '/for-stores',
  '/blog',
]

export const SCORING_WEIGHTS = {
  technical: 0.25,
  content: 0.25,
  structuredData: 0.20,
  performance: 0.10,
  geo: 0.20,
}

export const THRESHOLDS = {
  titleMinLength: 30,
  titleMaxLength: 60,
  descriptionMinLength: 120,
  descriptionMaxLength: 160,
  minWordCount: 300,
  maxResponseTimeMs: 500,
  fetchTimeoutMs: 10000,
}

export const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const
