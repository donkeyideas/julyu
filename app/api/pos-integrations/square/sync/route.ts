import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'
import SquarePOSService from '@/lib/services/square-pos'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { storeOwner, user, error: authError } = await getStoreOwner()

    if (authError || !storeOwner || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

    // Get store owner's bodega store
    const { data: store } = await supabase
      .from('bodega_stores')
      .select('id')
      .eq('store_owner_id', storeOwner.id)
      .single()

    if (!store) {
      return NextResponse.json(
        { error: 'No store found' },
        { status: 404 }
      )
    }

    // Get Square POS integration
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('*')
      .eq('bodega_store_id', store.id)
      .eq('pos_provider', 'square')
      .eq('is_active', true)
      .single()

    if (!integration) {
      return NextResponse.json(
        { error: 'Square POS not connected. Please connect your Square account first.' },
        { status: 404 }
      )
    }

    // Create Square service instance
    const squareService = new SquarePOSService({
      applicationId: process.env.SQUARE_APPLICATION_ID || '',
      accessToken: integration.access_token_encrypted, // TODO: Decrypt in production
      locationId: integration.merchant_id,
      environment: (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    })

    // Sync inventory
    const result = await squareService.syncInventory(store.id, supabase, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Sync failed', details: result.errors },
        { status: 500 }
      )
    }

    // Update last sync time
    await supabase
      .from('pos_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.itemsSynced} items from Square`,
      itemsSynced: result.itemsSynced,
    })

  } catch (error) {
    console.error('Square sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Square POS' },
      { status: 500 }
    )
  }
}
