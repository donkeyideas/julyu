import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null

    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch {
      // Supabase auth failed, try Firebase
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      store_name,
      store_retailer,
      store_address,
      shopping_method,
      delivery_partner,
      items_count,
      estimated_total,
      estimated_savings,
      items_json,
      comparison_id,
    } = body

    if (!store_name || !shopping_method) {
      return NextResponse.json({ error: 'store_name and shopping_method are required' }, { status: 400 })
    }

    const adminSupabase = createServiceRoleClient() as any

    // Insert shopping trip
    const { data: trip, error } = await adminSupabase
      .from('shopping_trips')
      .insert({
        user_id: userId,
        store_name,
        store_retailer: store_retailer || null,
        store_address: store_address || null,
        shopping_method,
        delivery_partner: delivery_partner || null,
        items_count: items_count || 0,
        estimated_total: estimated_total || 0,
        estimated_savings: estimated_savings || 0,
        items_json: items_json || null,
        comparison_id: comparison_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[ShoppingTrips] Insert error:', error)
      return NextResponse.json({ error: 'Failed to record shopping trip' }, { status: 500 })
    }

    // Also update user_savings for the current month
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    try {
      // Check if user_savings row exists for this month
      const { data: existingSavings } = await adminSupabase
        .from('user_savings')
        .select('id, trips_count, total_spent, total_saved')
        .eq('user_id', userId)
        .eq('month', monthKey)
        .single()

      if (existingSavings) {
        await adminSupabase
          .from('user_savings')
          .update({
            trips_count: (existingSavings.trips_count || 0) + 1,
            total_spent: (existingSavings.total_spent || 0) + (estimated_total || 0),
            total_saved: (existingSavings.total_saved || 0) + (estimated_savings || 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSavings.id)
      } else {
        await adminSupabase
          .from('user_savings')
          .insert({
            user_id: userId,
            month: monthKey,
            trips_count: 1,
            total_spent: estimated_total || 0,
            total_saved: estimated_savings || 0,
          })
      }
    } catch (savingsError) {
      // Non-critical: log but don't fail the request
      console.error('[ShoppingTrips] Failed to update user_savings:', savingsError)
    }

    return NextResponse.json({ success: true, tripId: trip.id })
  } catch (error) {
    console.error('[ShoppingTrips] Error:', error)
    return NextResponse.json({ error: 'Failed to record shopping trip' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null

    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch {
      // Supabase auth failed, try Firebase
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createServiceRoleClient() as any
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data: trips, error } = await adminSupabase
      .from('shopping_trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[ShoppingTrips] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch shopping trips' }, { status: 500 })
    }

    return NextResponse.json({ trips: trips || [] })
  } catch (error) {
    console.error('[ShoppingTrips] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch shopping trips' }, { status: 500 })
  }
}
