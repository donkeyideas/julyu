import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/auth/ensure-user'
import { hasFeature } from '@/lib/subscriptions/feature-gate'
import { spoonacularClient } from '@/lib/api/spoonacular'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user?.email || request.headers.get('x-user-email')
    const userName = user?.user_metadata?.full_name || request.headers.get('x-user-name')
    await ensureUserExists(userId, userEmail, userName as string | null)

    // Feature gate check (non-blocking if subscription tables are missing)
    try {
      const allowed = await hasFeature(userId, 'price_alerts')
      if (!allowed) {
        return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
      }
    } catch (featureError) {
      console.error('[Alerts] Feature gate check failed (allowing access):', featureError)
      // Allow access if feature gate fails — don't block users due to subscription table issues
    }

    const dbClient = createServiceRoleClient()

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
      // If the join to products fails, try without it
      if (error.code === 'PGRST200') {
        const { data: alertsNoJoin, error: fallbackError } = await dbClient
          .from('price_alerts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (fallbackError) {
          return NextResponse.json({ error: 'Failed to load alerts', details: fallbackError.message }, { status: 500 })
        }
        return NextResponse.json({ alerts: alertsNoJoin || [] })
      }
      return NextResponse.json({ error: 'Failed to load alerts', details: error.message }, { status: 500 })
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
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user?.email || request.headers.get('x-user-email')
    const userName = user?.user_metadata?.full_name || request.headers.get('x-user-name')
    await ensureUserExists(userId, userEmail, userName as string | null)

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

    if (!target_price || target_price <= 0) {
      return NextResponse.json({ error: 'Valid target price is required' }, { status: 400 })
    }

    if (!product_id && !product_name) {
      return NextResponse.json({ error: 'Product name or ID is required' }, { status: 400 })
    }

    const dbClient = createServiceRoleClient()

    // Find or create product
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

    const { data: alert, error } = await dbClient
      .from('price_alerts')
      .insert({
        user_id: userId,
        product_id: finalProductId,
        target_price,
        current_price: currentPrice,
        store_id: store_id || null,
        is_active: true,
        last_checked_at: currentPrice !== null ? now : null,
        lowest_price_found: currentPrice,
        triggered_at: isTriggered ? now : null,
      })
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
      console.error('[Alerts] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create alert', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('[Alerts] Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
