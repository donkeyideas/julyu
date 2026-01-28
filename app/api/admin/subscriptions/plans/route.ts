/**
 * GET  /api/admin/subscriptions/plans — Get all plans (admin)
 * PUT  /api/admin/subscriptions/plans — Update a plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllPlans, updatePlan } from '@/lib/subscriptions/plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await getAllPlans()
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('[Admin/Plans] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const plan = await updatePlan(id, updates)
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('[Admin/Plans] Update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan' },
      { status: 500 }
    )
  }
}
