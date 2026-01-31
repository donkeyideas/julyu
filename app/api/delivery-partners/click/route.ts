import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateDeepLink } from '@/lib/services/deep-link-generator'

interface ClickRequest {
  partnerId: string
  store: {
    store: string
    retailer?: string
    address?: string
    total: number
  }
  items: Array<{
    userInput?: string
    name?: string
    price?: number
    quantity?: number
  }>
  sessionId?: string
}

// POST - Log a click and generate deep link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body: ClickRequest = await request.json()
    const { partnerId, store, items, sessionId } = body

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Get current user (optional - clicks can be anonymous)
    const { data: { user } } = await supabase.auth.getUser()

    // Generate the deep link URL
    const deepLinkUrl = generateDeepLink(partner, store, items)
    const deepLinkUsed = !!(partner.deep_link_template && items.length > 0)

    // Calculate estimated commission
    let estimatedCommission = 0
    const estimatedTotal = store.total || 0

    switch (partner.commission_type) {
      case 'percentage':
        estimatedCommission = estimatedTotal * (partner.commission_rate || 0)
        break
      case 'flat':
        estimatedCommission = partner.flat_commission || 0
        break
      case 'per_order':
        estimatedCommission = partner.flat_commission || 0
        break
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    // Log the click
    const { data: click, error: clickError } = await supabase
      .from('delivery_partner_clicks')
      .insert({
        user_id: user?.id || null,
        partner_id: partnerId,
        store_name: store.store,
        store_retailer: store.retailer || null,
        store_address: store.address || null,
        items_json: items,
        items_count: items.length,
        estimated_total: estimatedTotal,
        generated_url: deepLinkUrl,
        deep_link_used: deepLinkUsed,
        commission_rate: partner.commission_type === 'percentage'
          ? partner.commission_rate
          : null,
        estimated_commission: estimatedCommission,
        session_id: sessionId || null,
        user_agent: userAgent,
        referrer: referrer
      })
      .select('id')
      .single()

    if (clickError) {
      console.error('Error logging click:', clickError)
      // Don't fail the request - still return the URL
    }

    return NextResponse.json({
      url: deepLinkUrl,
      clickId: click?.id || null,
      deepLinkUsed,
      partner: {
        name: partner.name,
        slug: partner.slug
      }
    })
  } catch (error) {
    console.error('Error processing click:', error)
    return NextResponse.json({ error: 'Failed to process click' }, { status: 500 })
  }
}
