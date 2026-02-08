import { NextRequest, NextResponse } from 'next/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'

export const dynamic = 'force-dynamic'

// POS Provider configurations
const POS_CONFIGS: Record<string, {
  name: string
  envClientId: string
  envClientSecret: string
  authUrl: string
  scopes: string[]
}> = {
  square: {
    name: 'Square',
    envClientId: 'SQUARE_APPLICATION_ID',
    envClientSecret: 'SQUARE_APPLICATION_SECRET',
    authUrl: 'https://connect.squareup.com/oauth2/authorize',
    scopes: ['ITEMS_READ', 'ITEMS_WRITE', 'INVENTORY_READ', 'INVENTORY_WRITE', 'MERCHANT_PROFILE_READ'],
  },
  clover: {
    name: 'Clover',
    envClientId: 'CLOVER_APP_ID',
    envClientSecret: 'CLOVER_APP_SECRET',
    authUrl: 'https://sandbox.dev.clover.com/oauth/authorize', // Use www.clover.com for production
    scopes: ['INVENTORY_READ', 'INVENTORY_WRITE'],
  },
  shopify: {
    name: 'Shopify',
    envClientId: 'SHOPIFY_API_KEY',
    envClientSecret: 'SHOPIFY_API_SECRET',
    authUrl: '', // Shopify requires shop domain, handled differently
    scopes: ['read_inventory', 'write_inventory', 'read_products', 'write_products'],
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params

    // Verify user is authenticated
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()
    if (authError || !storeOwner) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/store-portal/inventory/pos-sync', request.url))
    }

    // Check if provider is supported
    const config = POS_CONFIGS[provider]
    if (!config) {
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync?error=unsupported_provider&provider=${provider}`, request.url)
      )
    }

    // Check if API credentials are configured
    const clientId = process.env[config.envClientId]
    const clientSecret = process.env[config.envClientSecret]

    if (!clientId || !clientSecret) {
      // Redirect to setup page explaining that API credentials need to be configured
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync/setup?provider=${provider}`, request.url)
      )
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      storeOwnerId: storeOwner.id,
      timestamp: Date.now(),
      provider,
    })).toString('base64')

    // Build callback URL
    const callbackUrl = new URL(`/api/pos/${provider}/callback`, request.url).toString()

    // Handle Shopify differently (needs shop domain)
    if (provider === 'shopify') {
      // For Shopify, we need to collect the shop domain first
      return NextResponse.redirect(
        new URL(`/store-portal/inventory/pos-sync/shopify-setup?state=${state}`, request.url)
      )
    }

    // Build OAuth authorization URL
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    })

    const authUrl = `${config.authUrl}?${authParams.toString()}`

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('POS connect error:', error)
    return NextResponse.redirect(
      new URL('/store-portal/inventory/pos-sync?error=connection_failed', request.url)
    )
  }
}
