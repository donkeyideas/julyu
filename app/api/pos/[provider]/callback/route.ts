import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
// TODO: Uncomment when pos_connections table is created in Supabase
// import { createServiceRoleClient } from '@/lib/supabase/server'

// POS Provider configurations for token exchange
const POS_CONFIGS: Record<string, {
  name: string
  envClientId: string
  envClientSecret: string
  tokenUrl: string
}> = {
  square: {
    name: 'Square',
    envClientId: 'SQUARE_APPLICATION_ID',
    envClientSecret: 'SQUARE_APPLICATION_SECRET',
    tokenUrl: 'https://connect.squareup.com/oauth2/token',
  },
  clover: {
    name: 'Clover',
    envClientId: 'CLOVER_APP_ID',
    envClientSecret: 'CLOVER_APP_SECRET',
    tokenUrl: 'https://sandbox.dev.clover.com/oauth/token', // Use www.clover.com for production
  },
  shopify: {
    name: 'Shopify',
    envClientId: 'SHOPIFY_API_KEY',
    envClientSecret: 'SHOPIFY_API_SECRET',
    tokenUrl: '', // Shopify token URL includes shop domain
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error(`OAuth error from ${provider}:`, error)
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=oauth_denied&provider=${provider}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=missing_params&provider=${provider}`, request.url)
      )
    }

    // Decode and validate state
    let stateData: { storeOwnerId: string; timestamp: number; provider: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=invalid_state&provider=${provider}`, request.url)
      )
    }

    // Verify state hasn't expired (15 minutes)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=state_expired&provider=${provider}`, request.url)
      )
    }

    // Get provider config
    const config = POS_CONFIGS[provider]
    if (!config) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=unsupported_provider&provider=${provider}`, request.url)
      )
    }

    const clientId = process.env[config.envClientId]
    const clientSecret = process.env[config.envClientSecret]

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=missing_credentials&provider=${provider}`, request.url)
      )
    }

    // Exchange code for access token
    const callbackUrl = new URL(`/api/pos/${provider}/callback`, request.url).toString()

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error(`Token exchange failed for ${provider}:`, errorData)
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=token_exchange_failed&provider=${provider}`, request.url)
      )
    }

    const tokenData = await tokenResponse.json()

    // TODO: Store the connection in database once pos_connections table is created
    // To enable this, create the pos_connections table in Supabase with columns:
    // - id (uuid, primary key)
    // - store_owner_id (uuid, foreign key to store_owners)
    // - provider (text)
    // - access_token (text)
    // - refresh_token (text, nullable)
    // - expires_at (timestamptz, nullable)
    // - merchant_id (text, nullable)
    // - connected_at (timestamptz)
    // - is_active (boolean)
    // Then uncomment the code below:
    /*
    const supabase = createServiceRoleClient()

    const { error: dbError } = await supabase
      .from('pos_connections')
      .upsert({
        store_owner_id: stateData.storeOwnerId,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : null,
        merchant_id: tokenData.merchant_id || null,
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'store_owner_id,provider',
      })

    if (dbError) {
      console.error('Failed to save POS connection:', dbError)
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=save_failed&provider=${provider}`, request.url)
      )
    }
    */

    // Log successful token exchange (for debugging)
    console.log(`POS connection successful for ${provider}:`, {
      storeOwnerId: stateData.storeOwnerId,
      provider,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
    })

    // Success - redirect back to POS page
    return NextResponse.redirect(
      new URL(`/store-portal/inventory/pos-sync?success=connected&provider=${provider}`, request.url)
    )

  } catch (error) {
    console.error('POS callback error:', error)
    return NextResponse.redirect(
      new URL('/store-portal/inventory/pos-sync?error=callback_failed', request.url)
    )
  }
}
