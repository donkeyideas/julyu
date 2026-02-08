import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ClickStatRecord {
  partner_id: string | null
  converted: boolean | null
  estimated_commission: number | null
  actual_commission: number | null
}

interface PartnerRecord {
  id: string
  name: string
  slug: string
  [key: string]: unknown
}

// GET - List all delivery partners
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabase
      .from('delivery_partners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: partners, error } = await query

    if (error) throw error

    // Get click statistics for each partner (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: clickStats, error: clickError } = await supabase
      .from('delivery_partner_clicks')
      .select('partner_id, converted, estimated_commission, actual_commission')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (clickError) {
      console.error('Error fetching click stats:', clickError)
    }

    // Calculate stats per partner
    const statsMap: Record<string, { clicks: number; conversions: number; revenue: number }> = {}

    const clickData = clickStats as ClickStatRecord[] | null
    if (clickData) {
      clickData.forEach((click: ClickStatRecord) => {
        if (!click.partner_id) return
        if (!statsMap[click.partner_id]) {
          statsMap[click.partner_id] = { clicks: 0, conversions: 0, revenue: 0 }
        }
        statsMap[click.partner_id].clicks++
        if (click.converted) {
          statsMap[click.partner_id].conversions++
          statsMap[click.partner_id].revenue += click.actual_commission || click.estimated_commission || 0
        }
      })
    }

    // Attach stats to partners
    const partnerData = partners as PartnerRecord[] | null
    const partnersWithStats = (partnerData || []).map((partner: PartnerRecord) => ({
      ...partner,
      stats: statsMap[partner.id] || { clicks: 0, conversions: 0, revenue: 0 }
    }))

    return NextResponse.json({ partners: partnersWithStats })
  } catch (error) {
    console.error('Error fetching delivery partners:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery partners' }, { status: 500 })
  }
}

// POST - Create new delivery partner
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      name,
      display_name,
      slug,
      description,
      logo_url,
      icon_letter,
      brand_color,
      base_url,
      deep_link_template,
      affiliate_base_url,
      affiliate_id,
      api_key_encrypted,
      api_secret_encrypted,
      api_endpoint,
      api_config,
      commission_type,
      commission_rate,
      flat_commission,
      supports_deep_linking,
      supports_cart_api,
      supports_search_url,
      requires_partnership,
      sort_order,
      is_active,
      show_in_modal,
      supported_retailers
    } = body

    // Validate required fields
    if (!name || !slug || !base_url) {
      return NextResponse.json(
        { error: 'Name, slug, and base_url are required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    const { data: partner, error } = await supabase
      .from('delivery_partners')
      .insert({
        name,
        display_name,
        slug,
        description,
        logo_url,
        icon_letter: icon_letter || name.charAt(0).toUpperCase(),
        brand_color: brand_color || '#22C55E',
        base_url,
        deep_link_template,
        affiliate_base_url,
        affiliate_id,
        api_key_encrypted,
        api_secret_encrypted,
        api_endpoint,
        api_config: api_config || {},
        commission_type: commission_type || 'percentage',
        commission_rate: commission_rate || 0,
        flat_commission,
        supports_deep_linking: supports_deep_linking ?? false,
        supports_cart_api: supports_cart_api ?? false,
        supports_search_url: supports_search_url ?? true,
        requires_partnership: requires_partnership ?? false,
        sort_order: sort_order ?? 999,
        is_active: is_active ?? true,
        show_in_modal: show_in_modal ?? true,
        supported_retailers: supported_retailers || []
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A delivery partner with this slug already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ partner }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery partner:', error)
    return NextResponse.json({ error: 'Failed to create delivery partner' }, { status: 500 })
  }
}

// PUT - Update delivery partner
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Validate slug format if provided
    if (updateFields.slug && !/^[a-z0-9-]+$/.test(updateFields.slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'display_name', 'slug', 'description', 'logo_url', 'icon_letter',
      'brand_color', 'base_url', 'deep_link_template', 'affiliate_base_url',
      'affiliate_id', 'api_key_encrypted', 'api_secret_encrypted', 'api_endpoint',
      'api_config', 'commission_type', 'commission_rate', 'flat_commission',
      'supports_deep_linking', 'supports_cart_api', 'supports_search_url',
      'requires_partnership', 'sort_order', 'is_active', 'show_in_modal',
      'supported_retailers'
    ]

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: partner, error } = await supabase
      .from('delivery_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A delivery partner with this slug already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Error updating delivery partner:', error)
    return NextResponse.json({ error: 'Failed to update delivery partner' }, { status: 500 })
  }
}

// DELETE - Delete delivery partner
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Soft delete - just set is_active to false
    // This preserves click history for analytics
    const { error } = await supabase
      .from('delivery_partners')
      .update({ is_active: false, show_in_modal: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting delivery partner:', error)
    return NextResponse.json({ error: 'Failed to delete delivery partner' }, { status: 500 })
  }
}
