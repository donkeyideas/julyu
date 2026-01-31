/**
 * Stripe Webhooks — Handle Stripe webhook events.
 * Dual-writes to both user_subscriptions AND users.subscription_tier for backward compat.
 */

import type Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getPlanBySlug } from '@/lib/subscriptions/plans'
import { redeemPromoCode } from '@/lib/subscriptions/promo-codes'
import { invalidateFeatureCache } from '@/lib/subscriptions/feature-gate'

/**
 * Handle checkout.session.completed — user just subscribed.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = createServiceRoleClient() as any
  const userId = session.metadata?.userId
  const planSlug = session.metadata?.planSlug
  const promoCodeId = session.metadata?.promoCodeId

  if (!userId || !planSlug) {
    console.error('[Webhook] Missing userId or planSlug in session metadata')
    return
  }

  const plan = await getPlanBySlug(planSlug)
  if (!plan) {
    console.error(`[Webhook] Plan not found: ${planSlug}`)
    return
  }

  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  // Upsert user_subscriptions
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase
      .from('user_subscriptions')
      .update({
        plan_id: plan.id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        status: 'active',
        promo_code_id: promoCodeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('user_subscriptions').insert({
      user_id: userId,
      plan_id: plan.id,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: 'active',
      promo_code_id: promoCodeId || null,
    })
  }

  // Dual-write: update users.subscription_tier
  const tier = planSlug === 'enterprise' ? 'enterprise' : planSlug === 'free' ? 'free' : 'premium'
  await supabase
    .from('users')
    .update({ subscription_tier: tier, stripe_customer_id: stripeCustomerId })
    .eq('id', userId)

  // Redeem promo code if applicable
  if (promoCodeId) {
    try {
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single()

      await redeemPromoCode(userId, promoCodeId, sub?.id)
    } catch (err) {
      console.error('[Webhook] Promo redemption failed:', err)
    }
  }

  invalidateFeatureCache(userId)
}

/**
 * Handle customer.subscription.updated — status/period changes.
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createServiceRoleClient() as any

  // Find the user subscription by stripe_subscription_id
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!userSub) {
    console.error(`[Webhook] No user_subscription found for stripe sub: ${subscription.id}`)
    return
  }

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    trialing: 'trialing',
    unpaid: 'past_due',
    incomplete_expired: 'canceled',
  }

  const status = statusMap[subscription.status] || 'active'

  // In Stripe v20+, current_period is on subscription items
  const firstItem = subscription.items?.data?.[0]
  const periodStart = firstItem?.current_period_start
  const periodEnd = firstItem?.current_period_end

  await supabase
    .from('user_subscriptions')
    .update({
      status,
      ...(periodStart ? { current_period_start: new Date(periodStart * 1000).toISOString() } : {}),
      ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userSub.id)

  invalidateFeatureCache(userSub.user_id)
}

/**
 * Handle customer.subscription.deleted — subscription canceled.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createServiceRoleClient() as any

  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!userSub) return

  // Set status to canceled
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userSub.id)

  // Dual-write: revert users.subscription_tier to free
  await supabase
    .from('users')
    .update({ subscription_tier: 'free' })
    .eq('id', userSub.user_id)

  invalidateFeatureCache(userSub.user_id)
}

/**
 * Handle invoice.payment_failed — mark as past_due.
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createServiceRoleClient() as any

  // In Stripe v20+, subscription is under parent.subscription_details
  const subRef = invoice.parent?.subscription_details?.subscription
  if (!subRef) return

  const subId = typeof subRef === 'string' ? subRef : subRef.id

  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', subId)
    .single()

  if (!userSub) return

  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('id', userSub.id)

  invalidateFeatureCache(userSub.user_id)
}
