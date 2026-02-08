import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { isSearchConsoleConfigured, fetchSearchAnalytics } from '@/lib/seo/search-console'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Check configuration status
    if (searchParams.get('status') === 'true') {
      return NextResponse.json({
        success: true,
        configured: isSearchConsoleConfigured(),
      })
    }

    if (!isSearchConsoleConfigured()) {
      return NextResponse.json({
        success: true,
        configured: false,
        data: null,
        message: 'Google Search Console is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN, and GOOGLE_SEARCH_CONSOLE_SITE_URL environment variables.',
      })
    }

    const days = parseInt(searchParams.get('days') || '28', 10)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    // Fetch data with different dimensions
    const [queryData, pageData, dateData, deviceData, countryData] = await Promise.allSettled([
      fetchSearchAnalytics(formatDate(startDate), formatDate(endDate), ['query']),
      fetchSearchAnalytics(formatDate(startDate), formatDate(endDate), ['page']),
      fetchSearchAnalytics(formatDate(startDate), formatDate(endDate), ['date']),
      fetchSearchAnalytics(formatDate(startDate), formatDate(endDate), ['device']),
      fetchSearchAnalytics(formatDate(startDate), formatDate(endDate), ['country']),
    ])

    // Cache data in Supabase
    const supabase = await createServiceRoleClient() as any

    // Clear old cached data
    await supabase
      .from('search_console_data')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Store fresh data
    const dateRows = dateData.status === 'fulfilled' ? dateData.value : []
    if (dateRows.length > 0) {
      const rows = dateRows.map(row => ({
        date: row.date || formatDate(new Date()),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        fetched_at: new Date().toISOString(),
      }))

      await supabase.from('search_console_data').insert(rows)
    }

    return NextResponse.json({
      success: true,
      configured: true,
      data: {
        queries: queryData.status === 'fulfilled' ? queryData.value.slice(0, 50) : [],
        pages: pageData.status === 'fulfilled' ? pageData.value : [],
        trends: dateRows,
        devices: deviceData.status === 'fulfilled' ? deviceData.value : [],
        countries: countryData.status === 'fulfilled' ? countryData.value.slice(0, 20) : [],
      },
      period: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        days,
      },
    })
  } catch (error) {
    console.error('[Search Console] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
