import { google } from 'googleapis'

export function isSearchConsoleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN &&
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL
  )
}

function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  })
  return oauth2Client
}

export interface SearchAnalyticsRow {
  query?: string
  page?: string
  country?: string
  device?: string
  date?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function fetchSearchAnalytics(
  startDate: string,
  endDate: string,
  dimensions: string[] = ['query', 'page', 'date']
): Promise<SearchAnalyticsRow[]> {
  if (!isSearchConsoleConfigured()) {
    return []
  }

  const auth = getAuthClient()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL!

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: 1000,
      },
    })

    if (!response.data.rows) return []

    return response.data.rows.map(row => {
      const keys = row.keys || []
      const result: SearchAnalyticsRow = {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }

      dimensions.forEach((dim, i) => {
        if (dim === 'query') result.query = keys[i]
        if (dim === 'page') result.page = keys[i]
        if (dim === 'country') result.country = keys[i]
        if (dim === 'device') result.device = keys[i]
        if (dim === 'date') result.date = keys[i]
      })

      return result
    })
  } catch (error) {
    console.error('[SearchConsole] Error fetching analytics:', error)
    return []
  }
}

export async function fetchSitemapStatus(): Promise<Array<{
  path: string
  lastSubmitted: string | null
  isPending: boolean
  errors: number
  warnings: number
}>> {
  if (!isSearchConsoleConfigured()) {
    return []
  }

  const auth = getAuthClient()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL!

  try {
    const response = await searchconsole.sitemaps.list({ siteUrl })

    if (!response.data.sitemap) return []

    return response.data.sitemap.map(sm => ({
      path: sm.path || '',
      lastSubmitted: sm.lastSubmitted || null,
      isPending: sm.isPending || false,
      errors: sm.errors ? Number(sm.errors) : 0,
      warnings: sm.warnings ? Number(sm.warnings) : 0,
    }))
  } catch (error) {
    console.error('[SearchConsole] Error fetching sitemaps:', error)
    return []
  }
}
