/**
 * GET /api/ai/smart-alerts
 * Returns triggered price alerts with AI context (deal quality, urgency, stockpile recommendations).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { contextualizeTriggeredAlerts } from '@/lib/ai/alert-contextualizer'
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

    const allowed = await hasFeature(userId, 'price_alerts')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const alerts = await contextualizeTriggeredAlerts(userId)

    return NextResponse.json({
      alerts,
      totalTriggered: alerts.length,
      excellentDeals: alerts.filter(a => a.context.dealQuality === 'excellent').length,
      stockpileOpportunities: alerts.filter(a => a.context.stockpileRecommended).length,
    })
  } catch (error) {
    console.error('[SmartAlerts] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get smart alerts' },
      { status: 500 }
    )
  }
}
