/**
 * GET /api/b2b/categories — Category insights API
 * Query params: region, weeks
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateB2B, logB2BCall } from '@/lib/b2b/auth'
import { getAnonymizedCategoryInsights } from '@/lib/data/anonymizer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const auth = await authenticateB2B(request)
  if (!auth.authenticated || !auth.client) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || undefined
    const weeks = parseInt(searchParams.get('weeks') || '4', 10)

    const data = await getAnonymizedCategoryInsights({ region, weeks })

    const responseBody = { data, meta: { count: data.length, weeks, region: region || 'all' } }
    const responseStr = JSON.stringify(responseBody)

    await logB2BCall(
      auth.client.id,
      '/api/b2b/categories',
      { region, weeks },
      responseStr.length,
      Date.now() - startTime
    )

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('[B2B/Categories] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
