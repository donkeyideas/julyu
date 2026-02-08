/**
 * GET /api/ai/spending?days=90
 * Returns spending analysis with AI-generated insights.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { analyzeSpending } from '@/lib/ai/spending-analyzer'
import { hasFeature } from '@/lib/subscriptions/feature-gate'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeature(userId, 'spending_insights')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90', 10)

    const analysis = await analyzeSpending(userId, days)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[Spending] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze spending' },
      { status: 500 }
    )
  }
}
