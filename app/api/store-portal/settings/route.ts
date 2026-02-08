import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { storeOwner, error, status } = await getStoreOwnerAnyStatus()

    if (error || !storeOwner) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    const primaryStore = stores[0] || null

    return NextResponse.json({
      storeOwner,
      store: primaryStore
    })
  } catch (error) {
    console.error('[settings] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}
