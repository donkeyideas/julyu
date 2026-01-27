/**
 * GET  /api/subscriptions/manage — Get current subscription info
 * POST /api/subscriptions/manage — Cancel, reactivate, or open billing portal
 * Body: { action: 'cancel' | 'reactivate' | 'portal' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscriptions/feature-gate'
import { getStripeClient } from '@/lib/stripe/client'
import { createPortalSession } from '@/lib/stripe/checkout'
import { invalidateFeatureCache } from '@/lib/subscriptions/feature-gate'

function resolveUserId(request: NextRequest, user: { id: string } | null): string | null {
  if (user) return user.id
  return request.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const plan = await getUserPlan(userId)

    const adminSupabase = createServiceRoleClient()
    const { data: subscription } = await adminSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Check for promo code info
    let promoInfo = null
    if (subscription?.promo_code_id) {
      const { data: promo } = await adminSupabase
        .from('promo_codes')
        .select('code, description, type, value')
        .eq('id', subscription.promo_code_id)
        .single()
      promoInfo = promo
    }

    return NextResponse.json({
      plan,
      subscription: subscription || null,
      promo: promoInfo,
    })
  } catch (error) {
    console.error('[Subscriptions/Manage] GET Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body as { action: 'cancel' | 'reactivate' | 'portal' }

    const adminSupabase = createServiceRoleClient()
    const { data: subscription } = await adminSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    if (action === 'portal') {
      if (!subscription.stripe_customer_id) {
        return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
      }
      const { url } = await createPortalSession(subscription.stripe_customer_id)
      return NextResponse.json({ url })
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 400 })
    }

    const stripe = await getStripeClient()

    if (action === 'cancel') {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      await adminSupabase
        .from('user_subscriptions')
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq('id', subscription.id)

      invalidateFeatureCache(userId)
      return NextResponse.json({ message: 'Subscription will cancel at end of billing period' })
    }

    if (action === 'reactivate') {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      })

      await adminSupabase
        .from('user_subscriptions')
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq('id', subscription.id)

      invalidateFeatureCache(userId)
      return NextResponse.json({ message: 'Subscription reactivated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Subscriptions/Manage] POST Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}
