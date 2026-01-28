/**
 * POST /api/subscriptions/checkout — Create a Stripe checkout session
 * Body: { planSlug: string, promoCode?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/checkout'

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null
    let userEmail: string | null = null

    // Try Supabase auth
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      userId = user.id
      userEmail = user.email || null
    } else {
      // Try Firebase/Google auth via headers
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up email from DB if not available from auth
    if (!userEmail) {
      const adminSupabase = createServiceRoleClient()
      const { data: userData } = await adminSupabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      userEmail = userData?.email || null
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const body = await request.json()
    const { planSlug, promoCode } = body as { planSlug: string; promoCode?: string }

    if (!planSlug) {
      return NextResponse.json({ error: 'planSlug is required' }, { status: 400 })
    }

    const result = await createCheckoutSession(userId, userEmail, planSlug, promoCode)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Subscriptions/Checkout] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
