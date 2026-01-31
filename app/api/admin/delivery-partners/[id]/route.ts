import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface ClickRecord {
  id: string
  converted: boolean | null
  actual_commission: number | null
  estimated_commission: number | null
  order_total: number | null
}

// GET - Get single delivery partner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()

    const { data: partner, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 })
      }
      throw error
    }

    // Get click statistics for this partner
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: clicks, error: clickError } = await supabase
      .from('delivery_partner_clicks')
      .select('*')
      .eq('partner_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (clickError) {
      console.error('Error fetching clicks:', clickError)
    }

    // Calculate stats
    const clickData = clicks as ClickRecord[] | null
    const stats = {
      totalClicks: clickData?.length || 0,
      conversions: clickData?.filter((c: ClickRecord) => c.converted).length || 0,
      revenue: clickData?.reduce((sum: number, c: ClickRecord) => sum + (c.actual_commission || c.estimated_commission || 0), 0) || 0,
      avgOrderValue: 0 as number
    }

    if (stats.conversions > 0) {
      const totalOrders = clickData?.filter((c: ClickRecord) => c.converted).reduce((sum: number, c: ClickRecord) => sum + (c.order_total || 0), 0) || 0
      stats.avgOrderValue = totalOrders / stats.conversions
    }

    return NextResponse.json({
      partner,
      stats,
      recentClicks: clicks?.slice(0, 10) || []
    })
  } catch (error) {
    console.error('Error fetching delivery partner:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery partner' }, { status: 500 })
  }
}

// PUT - Update single delivery partner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const body = await request.json()

    // Validate slug format if provided
    if (body.slug && !/^[a-z0-9-]+$/.test(body.slug)) {
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
      if (body[field] !== undefined) {
        updateData[field] = body[field]
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
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 })
      }
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

// DELETE - Hard delete delivery partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - removes the partner completely
      // Note: clicks will have partner_id set to NULL due to ON DELETE SET NULL
      const { error } = await supabase
        .from('delivery_partners')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else {
      // Soft delete - just set is_active to false
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_active: false, show_in_modal: false })
        .eq('id', id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting delivery partner:', error)
    return NextResponse.json({ error: 'Failed to delete delivery partner' }, { status: 500 })
  }
}
