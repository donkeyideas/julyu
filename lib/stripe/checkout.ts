/**
 * Stripe Checkout — Creates checkout sessions for subscription purchases.
 */

import { getStripeClient } from './client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getPlanBySlug } from '@/lib/subscriptions/plans'
import { validatePromoCode, hasUserRedeemedCode } from '@/lib/subscriptions/promo-codes'
import type Stripe from 'stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.julyu.com'

/**
 * Create a Stripe checkout session for a subscription.
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planSlug: string,
  promoCode?: string
): Promise<{ url: string; sessionId: string }> {
  const stripe = await getStripeClient()
  const supabase = createServiceRoleClient() as any

  // Get the plan
  const plan = await getPlanBySlug(planSlug)
  if (!plan) throw new Error('Plan not found')
  if (!plan.is_self_serve) throw new Error('This plan requires contacting sales')
  if (!plan.stripe_price_id) throw new Error('Plan is not configured for billing. Admin must set a Stripe Price ID.')
  if (plan.price === 0) throw new Error('Cannot checkout for a free plan')

  // Get or create Stripe customer
  let stripeCustomerId: string | undefined

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (user?.stripe_customer_id) {
    stripeCustomerId = user.stripe_customer_id
  } else {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    })
    stripeCustomerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', userId)
  }

  // Build checkout session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/settings?subscription=success`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: {
      userId,
      planSlug,
      promoCode: promoCode || '',
    },
  }

  // Apply promo code if provided
  if (promoCode) {
    const promo = await validatePromoCode(promoCode, planSlug)

    // Check if user already used this code
    const alreadyUsed = await hasUserRedeemedCode(userId, promo.id)
    if (alreadyUsed) throw new Error('You have already used this promo code')

    if (promo.type === 'free_months') {
      // Free months → trial period
      sessionParams.subscription_data = {
        trial_period_days: Math.round(promo.value * 30),
        metadata: { promoCodeId: promo.id },
      }
    } else {
      // Percentage or fixed → create a Stripe coupon
      const couponParams: Stripe.CouponCreateParams = {
        duration: 'once',
        metadata: { promoCodeId: promo.id },
      }

      if (promo.type === 'percentage') {
        couponParams.percent_off = promo.value
      } else {
        couponParams.amount_off = Math.round(promo.value * 100) // cents
        couponParams.currency = 'usd'
      }

      const coupon = await stripe.coupons.create(couponParams)
      sessionParams.discounts = [{ coupon: coupon.id }]
    }

    // Store promo code ID in metadata for webhook to process
    sessionParams.metadata!.promoCodeId = promo.id
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) throw new Error('Failed to create checkout session')

  return { url: session.url, sessionId: session.id }
}

/**
 * Create a Stripe billing portal session for subscription management.
 */
export async function createPortalSession(
  stripeCustomerId: string
): Promise<{ url: string }> {
  const stripe = await getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/dashboard/settings`,
  })

  return { url: session.url }
}
