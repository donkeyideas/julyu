import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import StripeConnectService from '@/lib/services/stripe-connect'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already has Stripe account
    if (storeOwner.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account already exists' },
        { status: 400 }
      )
    }

    const stripeService = new StripeConnectService({
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
    })

    // Create Connect account
    const account = await stripeService.createConnectAccount({
      email: storeOwner.business_email || '',
      businessName: storeOwner.business_name,
      businessType: 'company',
      country: 'US',
    })

    // Save account ID to database
    const supabase = await createServerClient()
    await supabase
      .from('store_owners')
      .update({
        stripe_account_id: account.accountId,
        stripe_account_status: 'pending',
      })
      .eq('id', storeOwner.id)

    return NextResponse.json({
      success: true,
      accountId: account.accountId,
      onboardingUrl: account.onboardingUrl,
    })

  } catch (error) {
    console.error('Create Stripe account error:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
}
