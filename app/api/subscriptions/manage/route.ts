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
import { getPlanBySlug } from '@/lib/subscriptions/plans'
import type Stripe from 'stripe'

function resolveUserId(request: NextRequest, user: { id: string } | null): string | null {
  if (user) return user.id
  return request.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createServiceRoleClient() as any

    // Check for existing subscription
    let { data: subscription } = await adminSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no subscription record, check Stripe for active subscriptions (webhook may have failed)
    if (!subscription || subscription.status !== 'active') {
      const { data: userData } = await adminSupabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (userData?.stripe_customer_id) {
        try {
          const stripe = await getStripeClient()
          const stripeSubs = await stripe.subscriptions.list({
            customer: userData.stripe_customer_id,
            status: 'active',
            limit: 1,
          })

          const activeSub = stripeSubs.data[0]
          if (activeSub) {
            // Find the plan by matching the price ID
            const priceId = activeSub.items.data[0]?.price?.id
            const planSlug = activeSub.metadata?.planSlug || 'premium'
            const plan = await getPlanBySlug(planSlug)

            if (plan) {
              // Sync: create or update the subscription record
              const subData = {
                user_id: userId,
                plan_id: plan.id,
                stripe_subscription_id: activeSub.id,
                stripe_customer_id: userData.stripe_customer_id,
                status: 'active' as const,
                current_period_start: activeSub.items.data[0]?.current_period_start
                  ? new Date(activeSub.items.data[0].current_period_start * 1000).toISOString()
                  : null,
                current_period_end: activeSub.items.data[0]?.current_period_end
                  ? new Date(activeSub.items.data[0].current_period_end * 1000).toISOString()
                  : null,
                cancel_at_period_end: activeSub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              }

              if (subscription) {
                await adminSupabase
                  .from('user_subscriptions')
                  .update(subData)
                  .eq('user_id', userId)
              } else {
                await adminSupabase
                  .from('user_subscriptions')
                  .insert(subData)
              }

              // Dual-write: update users.subscription_tier
              const tier = planSlug === 'enterprise' ? 'enterprise' : planSlug === 'free' ? 'free' : 'premium'
              await adminSupabase
                .from('users')
                .update({ subscription_tier: tier })
                .eq('id', userId)

              invalidateFeatureCache(userId)
              console.log(`[Manage] Synced subscription from Stripe for user ${userId}`)

              // Re-fetch the subscription
              const { data: refreshed } = await adminSupabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .single()
              subscription = refreshed
            }
          }
        } catch (syncErr) {
          console.error('[Manage] Stripe sync error:', syncErr)
        }
      }
    }

    const plan = await getUserPlan(userId)

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
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = resolveUserId(request, user)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body as { action: 'cancel' | 'reactivate' | 'portal' }

    const adminSupabase = createServiceRoleClient() as any
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
