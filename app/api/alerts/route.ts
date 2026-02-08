import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/auth/ensure-user'
import { hasFeature } from '@/lib/subscriptions/feature-gate'
import { spoonacularClient } from '@/lib/api/spoonacular'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null

    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email || null
        userName = user.user_metadata?.full_name || null
      }
    } catch (authError) {
      console.error('[Alerts] Supabase auth failed (trying Firebase):', authError)
    }

    // Fall back to Firebase headers
    if (!userId) {
      userId = request.headers.get('x-user-id')
      userEmail = request.headers.get('x-user-email')
      userName = request.headers.get('x-user-name')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserExists(userId, userEmail, userName)

    // Feature gate check (non-blocking if subscription tables are missing)
    try {
      const allowed = await hasFeature(userId, 'price_alerts')
      if (!allowed) {
        return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
      }
    } catch (featureError) {
      console.error('[Alerts] Feature gate check failed (allowing access):', featureError)
    }

    const dbClient = createServiceRoleClient() as any

    // Try query with products join first
    const { data: alerts, error } = await dbClient
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
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Alerts] Database error:', JSON.stringify(error))
      // Fallback: query without products join
      const { data: alertsNoJoin, error: fallbackError } = await dbClient
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('[Alerts] Fallback query also failed:', JSON.stringify(fallbackError))
        return NextResponse.json({ error: 'Failed to load alerts', details: fallbackError.message }, { status: 500 })
      }
      return NextResponse.json({ alerts: alertsNoJoin || [] })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('[Alerts] Unhandled error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to load alerts', details: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Alerts] POST request received')
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null

    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email || null
        userName = user.user_metadata?.full_name || null
        console.log('[Alerts] Got user from Supabase:', userId)
      }
    } catch (authError) {
      console.error('[Alerts] Supabase auth failed (trying Firebase):', authError)
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
      userEmail = request.headers.get('x-user-email')
      userName = request.headers.get('x-user-name')
      console.log('[Alerts] Got user from headers:', userId)
    }

    if (!userId) {
      console.error('[Alerts] No user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Alerts] Ensuring user exists...')
    await ensureUserExists(userId, userEmail, userName)
    console.log('[Alerts] User exists check passed')

    // Feature gate check (non-blocking if subscription tables are missing)
    try {
      const allowed = await hasFeature(userId, 'price_alerts')
      if (!allowed) {
        return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
      }
    } catch (featureError) {
      console.error('[Alerts] Feature gate check failed (allowing access):', featureError)
    }

    const body = await request.json()
    const { product_id, product_name, target_price, store_id } = body
    console.log('[Alerts] Request body:', { product_id, product_name, target_price, store_id })

    if (!target_price || target_price <= 0) {
      console.error('[Alerts] Invalid target price:', target_price)
      return NextResponse.json({ error: 'Valid target price is required' }, { status: 400 })
    }

    if (!product_id && !product_name) {
      console.error('[Alerts] No product ID or name provided')
      return NextResponse.json({ error: 'Product name or ID is required' }, { status: 400 })
    }

    const dbClient = createServiceRoleClient() as any

    // Find or create product
    console.log('[Alerts] Finding or creating product...')
    let finalProductId = product_id
    if (!finalProductId && product_name) {
      // Escape LIKE pattern chars in user input
      const escapedName = product_name.replace(/[%_]/g, '\\$&')
      const { data: existingProducts } = await dbClient
        .from('products')
        .select('id')
        .ilike('name', `%${escapedName}%`)
        .limit(1)

      if (existingProducts && existingProducts.length > 0) {
        finalProductId = existingProducts[0].id
      } else {
        const { data: newProduct, error: productError } = await dbClient
          .from('products')
          .insert({ name: product_name })
          .select('id')
          .single()

        if (productError) {
          // Race condition: another request may have created the product
          const { data: retryProducts } = await dbClient
            .from('products')
            .select('id')
            .ilike('name', `%${escapedName}%`)
            .limit(1)

          if (retryProducts && retryProducts.length > 0) {
            finalProductId = retryProducts[0].id
          } else {
            console.error('[Alerts] Failed to create product:', productError)
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
          }
        } else {
          finalProductId = newProduct.id
        }
      }
    }

    // Try to get current price from DB
    let currentPrice: number | null = null
    if (finalProductId) {
      const { data: priceData } = await dbClient
        .from('prices')
        .select('price')
        .eq('product_id', finalProductId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      currentPrice = priceData?.price ?? null
    }

    // If no DB price, try Spoonacular
    if (currentPrice === null && product_name) {
      try {
        const isConfigured = await spoonacularClient.isConfiguredAsync()
        if (isConfigured) {
          const results = await spoonacularClient.searchGroceryProducts(product_name, { number: 1 })
          if (results.length > 0 && results[0].price != null) {
            currentPrice = results[0].price
          }
        }
      } catch (e) {
        console.error('[Alerts] Spoonacular price lookup failed (non-fatal):', e)
      }
    }

    const now = new Date().toISOString()
    const isTriggered = currentPrice !== null && currentPrice <= target_price

    console.log('[Alerts] Inserting alert with:', {
      user_id: userId,
      product_id: finalProductId,
      target_price,
      current_price: currentPrice,
    })

    // Insert the alert without join first
    const { data: alert, error } = await dbClient
      .from('price_alerts')
      .insert({
        user_id: userId,
        product_id: finalProductId,
        target_price,
        current_price: currentPrice,
        // Note: store_id removed due to schema cache issues
        is_active: true,
        last_checked_at: currentPrice !== null ? now : null,
        lowest_price_found: currentPrice,
        triggered_at: isTriggered ? now : null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[Alerts] Insert error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to create alert', details: error.message }, { status: 500 })
    }

    console.log('[Alerts] Alert created successfully:', alert.id)

    // Fetch product details separately if product_id exists
    let productDetails = null
    if (alert.product_id) {
      const { data: product } = await dbClient
        .from('products')
        .select('id, name, brand, category, image_url')
        .eq('id', alert.product_id)
        .single()

      productDetails = product
    }

    return NextResponse.json({
      alert: {
        ...alert,
        products: productDetails
      }
    }, { status: 201 })
  } catch (error) {
    console.error('[Alerts] Error creating alert:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[Alerts] Error stack:', stack)
    return NextResponse.json({
      error: 'Failed to create alert',
      details: message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined
    }, { status: 500 })
  }
}
