import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Returns all stores (including inactive) for admin
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('store_ticker')
      .select('*')
      .order('display_order')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stores: data || [] })
  } catch (error) {
    console.error('Admin store ticker API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new store
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, logo_url, website_url, display_order, is_active, parent_network } = body

    if (!name || !logo_url) {
      return NextResponse.json({ error: 'Name and logo_url are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('store_ticker')
      .insert({
        name,
        logo_url,
        website_url: website_url || null,
        display_order: display_order || 0,
        is_active: is_active !== false,
        parent_network: parent_network || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ store: data })
  } catch (error) {
    console.error('Admin store ticker POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update store
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, logo_url, website_url, display_order, is_active, parent_network } = body

    if (!id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('store_ticker')
      .update({
        name,
        logo_url,
        website_url: website_url || null,
        display_order,
        is_active,
        parent_network: parent_network || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ store: data })
  } catch (error) {
    console.error('Admin store ticker PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove store
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('store_ticker')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin store ticker DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
