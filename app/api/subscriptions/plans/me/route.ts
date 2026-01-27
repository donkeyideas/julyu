/**
 * GET /api/subscriptions/plans/me — Current user's plan + features + subscription info
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getUserPlan, getUserPlanFeatures } from '@/lib/subscriptions/feature-gate'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null

    // Try Supabase auth
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      userId = user.id
    } else {
      // Try Firebase/Google auth via headers
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [plan, features] = await Promise.all([
      getUserPlan(userId),
      getUserPlanFeatures(userId),
    ])

    // Get subscription details
    const adminSupabase = createServiceRoleClient()
    const { data: subscription } = await adminSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      plan,
      features,
      subscription: subscription || null,
    })
  } catch (error) {
    console.error('[Subscriptions/Me] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
