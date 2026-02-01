import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

export async function PUT(request: NextRequest) {
  try {
    const { storeOwner, error, status } = await getStoreOwner(request)

    if (error || !storeOwner) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await request.json()
    const { name, address, city, state, zip, phone } = body

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Name, address, city, state, and ZIP are required' },
        { status: 400 }
      )
    }

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    const primaryStore = stores[0]

    if (!primaryStore) {
      return NextResponse.json(
        { error: 'No store found for this account' },
        { status: 404 }
      )
    }

    const supabase = await createServerClient()

    // Update store
    const { error: updateError } = await supabase
      .from('bodega_stores')
      .update({
        name,
        address,
        city,
        state,
        zip,
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryStore.id)
      .eq('store_owner_id', storeOwner.id)

    if (updateError) {
      console.error('[settings/store] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update store information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[settings/store] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}
