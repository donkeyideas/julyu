/**
 * GET /api/subscriptions/plans — Public active plans list (for pricing page)
 */

import { NextResponse } from 'next/server'
import { getActivePlans } from '@/lib/subscriptions/plans'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const plans = await getActivePlans()
    return NextResponse.json(
      { plans },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[Subscriptions/Plans] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
