import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - List all commission tiers
export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    const { data: tiers, error } = await supabase
      .from('commission_tiers')
      .select('*')
      .order('commission_percentage', { ascending: false })

    if (error) {
      console.error('Error fetching commission tiers:', error)
      return NextResponse.json({ error: 'Failed to fetch commission tiers' }, { status: 500 })
    }

    return NextResponse.json({ tiers: tiers || [] })
  } catch (error) {
    console.error('Error in commission tiers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new commission tier
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()

    const { name, description, commission_percentage, min_monthly_orders, min_monthly_revenue, features, is_default } = body

    if (!name || commission_percentage === undefined) {
      return NextResponse.json({ error: 'Name and commission percentage are required' }, { status: 400 })
    }

    // If this is being set as default, unset any existing default
    if (is_default) {
      await supabase
        .from('commission_tiers')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    const { data: tier, error } = await supabase
      .from('commission_tiers')
      .insert({
        name,
        description: description || null,
        commission_percentage: parseFloat(commission_percentage),
        min_monthly_orders: min_monthly_orders || 0,
        min_monthly_revenue: min_monthly_revenue || 0,
        features: features || [],
        is_active: true,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commission tier:', error)
      return NextResponse.json({ error: 'Failed to create commission tier' }, { status: 500 })
    }

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Error in commission tiers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a commission tier
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()

    const { id, name, description, commission_percentage, min_monthly_orders, min_monthly_revenue, features, is_active, is_default } = body

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 })
    }

    // If this is being set as default, unset any existing default
    if (is_default) {
      await supabase
        .from('commission_tiers')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id)
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (commission_percentage !== undefined) updateData.commission_percentage = parseFloat(commission_percentage)
    if (min_monthly_orders !== undefined) updateData.min_monthly_orders = min_monthly_orders
    if (min_monthly_revenue !== undefined) updateData.min_monthly_revenue = min_monthly_revenue
    if (features !== undefined) updateData.features = features
    if (is_active !== undefined) updateData.is_active = is_active
    if (is_default !== undefined) updateData.is_default = is_default

    const { data: tier, error } = await supabase
      .from('commission_tiers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating commission tier:', error)
      return NextResponse.json({ error: 'Failed to update commission tier' }, { status: 500 })
    }

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Error in commission tiers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
