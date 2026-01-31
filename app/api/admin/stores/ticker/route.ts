import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Returns all stores (including inactive) for admin
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('store_ticker')
      .select('*')
      .order('display_order')

    if (error) {
      console.error('[Store Ticker API] Error fetching:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stores: data || [] })
  } catch (error: any) {
    console.error('[Store Ticker API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add new store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

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
      console.error('[Store Ticker API] Error creating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ store: data })
  } catch (error: any) {
    console.error('[Store Ticker API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update store
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

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
      console.error('[Store Ticker API] Error updating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ store: data })
  } catch (error: any) {
    console.error('[Store Ticker API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove store
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('store_ticker')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Store Ticker API] Error deleting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Store Ticker API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
