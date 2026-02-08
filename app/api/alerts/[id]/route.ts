import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/auth/ensure-user'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbClient = createServiceRoleClient() as any

    const { data: alert, error } = await dbClient
      .from('price_alerts')
      .select(`
        *,
        products (
          id,
          name,
          brand,
          category,
          image_url
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      console.error('[Alert] Error:', error)
      return NextResponse.json({ error: 'Failed to load alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('[Alert] Error:', error)
    return NextResponse.json({ error: 'Failed to load alert' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user?.email || request.headers.get('x-user-email')
    const userName = user?.user_metadata?.full_name || request.headers.get('x-user-name')
    await ensureUserExists(userId, userEmail, userName as string | null)

    const dbClient = createServiceRoleClient() as any

    // Verify ownership
    const { data: existing, error: existError } = await dbClient
      .from('price_alerts')
      .select('id, current_price')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (existError || !existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const body = await request.json()
    const { target_price, store_id, notes } = body

    const updateData: Record<string, unknown> = {}
    if (target_price !== undefined) {
      if (typeof target_price !== 'number' || target_price <= 0) {
        return NextResponse.json({ error: 'Valid target price is required' }, { status: 400 })
      }
      updateData.target_price = target_price
      // Recalculate trigger status
      if (existing.current_price !== null) {
        if (existing.current_price <= target_price) {
          updateData.triggered_at = new Date().toISOString()
        } else {
          updateData.triggered_at = null
        }
      }
    }
    if (store_id !== undefined) updateData.store_id = store_id
    if (notes !== undefined) updateData.notes = notes

    const { data: alert, error } = await dbClient
      .from('price_alerts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        products (
          id,
          name,
          brand,
          category,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error('[Alert] Update error:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('[Alert] Error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbClient = createServiceRoleClient() as any

    // Hard delete
    const { error } = await dbClient
      .from('price_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[Alert] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Alert] Error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
