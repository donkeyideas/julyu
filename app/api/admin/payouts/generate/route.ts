import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import StripeConnectService from '@/lib/services/stripe-connect'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Use service role client for admin operations
    // Admin access is already verified by the admin layout
    const supabase = createServiceRoleClient() as any

    const body = await request.json()
    const { periodStart, periodEnd } = body

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Period start and end dates are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)

    // Get all approved store owners
    const { data: storeOwners, error: ownersError } = await supabase
      .from('store_owners')
      .select('id, business_name, stripe_account_id')
      .eq('application_status', 'approved')

    if (ownersError || !storeOwners) {
      return NextResponse.json(
        { error: 'Failed to fetch store owners' },
        { status: 500 }
      )
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 400 }
      )
    }

    // Check if there are any store owners to process
    if (storeOwners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No approved store owners found',
        payoutsCreated: 0,
        totalAmount: 0,
      })
    }

    const stripeService = new StripeConnectService({
      secretKey: process.env.STRIPE_SECRET_KEY,
      connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
    })

    let payoutsCreated = 0
    let totalAmount = 0
    const errors: string[] = []

    // Generate payout for each store owner
    for (const owner of storeOwners) {
      try {
        const result = await stripeService.generatePayout(
          owner.id,
          startDate,
          endDate,
          supabase
        )

        if (result.success) {
          payoutsCreated++
          totalAmount += result.amount || 0
        } else if (result.error && result.error !== 'No completed orders in this period') {
          errors.push(`${owner.business_name}: ${result.error}`)
        }
      } catch (error) {
        errors.push(`${owner.business_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${payoutsCreated} payout(s)`,
      payoutsCreated,
      totalAmount,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Generate payouts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
