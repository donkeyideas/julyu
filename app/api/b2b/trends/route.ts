/**
 * GET /api/b2b/trends — Price trends API
 * Query params: category (required), region, weeks
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateB2B, logB2BCall } from '@/lib/b2b/auth'
import { getAnonymizedTrends } from '@/lib/data/anonymizer'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const auth = await authenticateB2B(request)
  if (!auth.authenticated || !auth.client) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const region = searchParams.get('region') || undefined
    const weeks = parseInt(searchParams.get('weeks') || '12', 10)

    if (!category) {
      return NextResponse.json({ error: 'category parameter is required' }, { status: 400 })
    }

    const data = await getAnonymizedTrends({ category, region, weeks })

    const responseBody = { data, meta: { count: data.length, category, weeks, region: region || 'all' } }
    const responseStr = JSON.stringify(responseBody)

    await logB2BCall(
      auth.client.id,
      '/api/b2b/trends',
      { category, region, weeks },
      responseStr.length,
      Date.now() - startTime
    )

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('[B2B/Trends] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
