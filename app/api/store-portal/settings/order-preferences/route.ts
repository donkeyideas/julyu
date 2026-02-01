import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'

export async function PUT(request: NextRequest) {
  try {
    const { storeOwner, error, status } = await getStoreOwnerAnyStatus()

    if (error || !storeOwner) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await request.json()
    const { accepts_orders, auto_accept_orders } = body

    const supabase = await createServerClient()

    // Update store owner order preferences
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        accepts_orders: accepts_orders ?? true,
        auto_accept_orders: auto_accept_orders ?? false,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeOwner.id)

    if (updateError) {
      console.error('[settings/order-preferences] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[settings/order-preferences] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
