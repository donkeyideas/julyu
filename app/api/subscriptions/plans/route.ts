/**
 * GET /api/subscriptions/plans — Public active plans list (for pricing page)
 */

import { NextResponse } from 'next/server'
import { getActivePlans } from '@/lib/subscriptions/plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await getActivePlans()
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('[Subscriptions/Plans] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
