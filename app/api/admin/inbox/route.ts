import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('contact_messages')
      .select('*', { count: 'exact' })

    if (filter === 'unread') {
      query = query.eq('is_read', false)
    } else if (filter === 'read') {
      query = query.eq('is_read', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: messages, count, error } = await query

    if (error) {
      console.error('[Inbox] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get stats
    const { count: totalCount } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })

    const { count: unreadCount } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
      stats: {
        total: totalCount || 0,
        unread: unreadCount || 0,
        read: (totalCount || 0) - (unreadCount || 0),
      },
      page,
      limit,
    })
  } catch (error) {
    console.error('[Inbox] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const { id, is_read, read_by } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_messages')
      .update({
        is_read: !!is_read,
        read_at: is_read ? new Date().toISOString() : null,
        read_by: is_read && read_by ? read_by : null,
      })
      .eq('id', id)

    if (error) {
      console.error('[Inbox] Update error:', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Inbox] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Inbox] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Inbox] Unexpected error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
