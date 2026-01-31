import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    const { data: features, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ features: features || [] })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { name, description, is_enabled, rollout_percentage } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: feature, error } = await supabase
      .from('feature_flags')
      .insert({
        name,
        description,
        is_enabled: is_enabled ?? false,
        rollout_percentage: rollout_percentage ?? 0
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Feature flag with this name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ feature }, { status: 201 })
  } catch (error) {
    console.error('Error creating feature flag:', error)
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, name, description, is_enabled, rollout_percentage } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled
    if (rollout_percentage !== undefined) updateData.rollout_percentage = rollout_percentage

    const { data: feature, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feature flag:', error)
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
  }
}
