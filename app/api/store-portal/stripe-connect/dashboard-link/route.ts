import { NextRequest, NextResponse } from 'next/server'
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

    if (!storeOwner.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 400 }
      )
    }

    const stripeService = new StripeConnectService({
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
    })

    const url = await stripeService.createLoginLink(storeOwner.stripe_account_id)

    return NextResponse.json({ url })

  } catch (error) {
    console.error('Create Stripe login link error:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    )
  }
}
