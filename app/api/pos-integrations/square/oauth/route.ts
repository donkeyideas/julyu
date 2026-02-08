import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'
import SquarePOSService from '@/lib/services/square-pos'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      )
    }

    // Exchange code for token
    const tokenData = await SquarePOSService.exchangeCodeForToken(code)

    const { storeOwner, user, error: authError } = await getStoreOwner()

    if (authError || !storeOwner || !user) {
      return NextResponse.redirect(
        new URL('/store-portal/apply?error=unauthorized', request.url)
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
        { error: 'No store found for this owner' },
        { status: 404 }
      )
    }

    // Save POS integration
    const { error: insertError } = await supabase
      .from('pos_integrations')
      .insert({
        bodega_store_id: store.id,
        pos_provider: 'square',
        access_token_encrypted: tokenData.accessToken, // TODO: Encrypt in production
        merchant_id: tokenData.merchantId,
        auto_sync_enabled: true,
        sync_frequency_minutes: 60,
        is_active: true,
      })

    if (insertError) {
      console.error('Failed to save Square integration:', insertError)
      return NextResponse.redirect(
        new URL('/store-portal/inventory/pos-sync?error=save_failed', request.url)
      )
    }

    // Redirect to POS sync page with success
    return NextResponse.redirect(
      new URL('/store-portal/inventory/pos-sync?success=connected', request.url)
    )

  } catch (error) {
    console.error('Square OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/store-portal/inventory/pos-sync?error=${encodeURIComponent('connection_failed')}`, request.url)
    )
  }
}
