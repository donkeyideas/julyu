/**
 * Stripe Connect Integration
 * Handles store owner account creation and payouts
 */

interface StripeConnectConfig {
  secretKey: string
  connectClientId: string
}

interface ConnectAccountData {
  email: string
  businessName: string
  businessType: 'individual' | 'company'
  country: string
}

interface PayoutData {
  amount: number // in cents
  currency: string
  destination: string // Stripe account ID
  description: string
}

export class StripeConnectService {
  private stripe: any
  private config: StripeConnectConfig

  constructor(config: StripeConnectConfig) {
    this.config = config
    // Lazy load Stripe to avoid issues
    const Stripe = require('stripe')
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2024-11-20.acacia',
    })
  }

  /**
   * Create Express Connect account for store owner
   */
  async createConnectAccount(data: ConnectAccountData): Promise<{
    accountId: string
    onboardingUrl: string
  }> {
    try {
      // Create Express account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: data.country || 'US',
        email: data.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: data.businessType,
        business_profile: {
          name: data.businessName,
        },
      })

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/store-portal/settings/payouts?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/store-portal/settings/payouts?success=true`,
        type: 'account_onboarding',
      })

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      }

    } catch (error) {
      console.error('Stripe Connect account creation error:', error)
      throw new Error('Failed to create Stripe Connect account')
    }
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string): Promise<{
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    requirements: any
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId)

      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
      }

    } catch (error) {
      console.error('Stripe account status error:', error)
      throw new Error('Failed to retrieve account status')
    }
  }

  /**
   * Create payout to store owner
   */
  async createPayout(data: PayoutData): Promise<{
    payoutId: string
    amount: number
    status: string
    arrivalDate: number
  }> {
    try {
      // Create transfer to connected account
      const transfer = await this.stripe.transfers.create({
        amount: data.amount,
        currency: data.currency,
        destination: data.destination,
        description: data.description,
      })

      return {
        payoutId: transfer.id,
        amount: transfer.amount / 100,
        status: transfer.status || 'pending',
        arrivalDate: transfer.created,
      }

    } catch (error) {
      console.error('Stripe payout error:', error)
      throw new Error('Failed to create payout')
    }
  }

  /**
   * Create login link for dashboard access
   */
  async createLoginLink(accountId: string): Promise<string> {
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId)
      return loginLink.url

    } catch (error) {
      console.error('Stripe login link error:', error)
      throw new Error('Failed to create login link')
    }
  }

  /**
   * Generate payout for time period
   */
  async generatePayout(
    storeOwnerId: string,
    periodStart: Date,
    periodEnd: Date,
    supabase: any
  ): Promise<{
    success: boolean
    payoutId?: string
    amount?: number
    error?: string
  }> {
    try {
      // Get all completed orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('bodega_orders')
        .select('*')
        .eq('store_owner_id', storeOwnerId)
        .eq('status', 'delivered')
        .gte('completed_at', periodStart.toISOString())
        .lte('completed_at', periodEnd.toISOString())

      if (ordersError) {
        throw new Error('Failed to fetch orders')
      }

      if (!orders || orders.length === 0) {
        return {
          success: false,
          error: 'No completed orders in this period',
        }
      }

      // Calculate totals
      const totalOrders = orders.length
      const grossRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
      const totalCommissions = orders.reduce((sum, o) => {
        const orderTotal = parseFloat(o.total_amount)
        const storePayout = parseFloat(o.store_payout)
        const deliveryFee = parseFloat(o.delivery_fee)
        return sum + (orderTotal - storePayout - deliveryFee)
      }, 0)
      const netPayout = orders.reduce((sum, o) => sum + parseFloat(o.store_payout), 0)

      // Get store owner Stripe account
      const { data: storeOwner } = await supabase
        .from('store_owners')
        .select('stripe_account_id')
        .eq('id', storeOwnerId)
        .single()

      if (!storeOwner?.stripe_account_id) {
        return {
          success: false,
          error: 'Stripe account not connected',
        }
      }

      // Create payout
      const payout = await this.createPayout({
        amount: Math.round(netPayout * 100), // Convert to cents
        currency: 'usd',
        destination: storeOwner.stripe_account_id,
        description: `Payout for ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
      })

      // Record payout in database
      await supabase
        .from('store_payouts')
        .insert({
          store_owner_id: storeOwnerId,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          total_orders: totalOrders,
          gross_revenue: grossRevenue,
          total_commissions: totalCommissions,
          net_payout: netPayout,
          stripe_payout_id: payout.payoutId,
          status: 'processing',
        })

      return {
        success: true,
        payoutId: payout.payoutId,
        amount: payout.amount,
      }

    } catch (error) {
      console.error('Generate payout error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export default StripeConnectService
