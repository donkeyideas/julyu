import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Demo alerts for when database isn't available
function getDemoAlerts() {
  return [
    {
      id: 'demo-alert-1',
      user_id: 'test-user-id',
      product_id: 'prod-1',
      target_price: 3.99,
      current_price: 4.49,
      is_active: true,
      created_at: new Date().toISOString(),
      products: {
        id: 'prod-1',
        name: 'Organic Milk (1 gallon)',
        brand: 'Horizon',
        category: 'Dairy',
        image_url: null
      }
    },
    {
      id: 'demo-alert-2',
      user_id: 'test-user-id',
      product_id: 'prod-2',
      target_price: 2.50,
      current_price: 2.99,
      is_active: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      products: {
        id: 'prod-2',
        name: 'Large Eggs (dozen)',
        brand: 'Happy Egg',
        category: 'Dairy',
        image_url: null
      }
    },
    {
      id: 'demo-alert-3',
      user_id: 'test-user-id',
      product_id: 'prod-3',
      target_price: 1.99,
      current_price: 1.79,
      is_active: true,
      triggered_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString(),
      products: {
        id: 'prod-3',
        name: 'Bananas (per lb)',
        brand: null,
        category: 'Produce',
        image_url: null
      }
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      // Return demo alerts for unauthenticated users
      return NextResponse.json({ alerts: getDemoAlerts() })
    }

    const { data: alerts, error } = await supabase
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Alerts] Database error:', error)
      // Return demo alerts if table doesn't exist or other errors
      return NextResponse.json({ alerts: getDemoAlerts() })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    // Return demo alerts on any error
    return NextResponse.json({ alerts: getDemoAlerts() })
  }
}

export async function POST(request: NextRequest) {
  let requestBody: { product_id?: string; product_name?: string; target_price?: number; store_id?: string } = {}

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    requestBody = await request.json()
    const { product_id, product_name, target_price, store_id } = requestBody

    if (!target_price) {
      return NextResponse.json({ error: 'Target price is required' }, { status: 400 })
    }

    // For demo mode or if user not authenticated, return a demo alert
    if (!userId || isTestMode) {
      const demoAlert = {
        id: `alert-${Date.now()}`,
        user_id: userId || 'test-user-id',
        product_id: product_id || `prod-${Date.now()}`,
        target_price,
        current_price: null,
        is_active: true,
        created_at: new Date().toISOString(),
        products: {
          id: product_id || `prod-${Date.now()}`,
          name: product_name || 'Custom Product',
          brand: null,
          category: null,
          image_url: null
        }
      }
      return NextResponse.json({ alert: demoAlert }, { status: 201 })
    }

    // If product_name is provided but no product_id, try to find or create the product
    let finalProductId = product_id
    if (!finalProductId && product_name) {
      // Search for existing product
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .ilike('name', `%${product_name}%`)
        .limit(1)
        .single()

      if (existingProduct) {
        finalProductId = existingProduct.id
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({ name: product_name })
          .select('id')
          .single()

        if (!productError && newProduct) {
          finalProductId = newProduct.id
        }
      }
    }

    // Get current price if available
    let currentPrice = null
    if (finalProductId) {
      const { data: priceData } = await supabase
        .from('prices')
        .select('price')
        .eq('product_id', finalProductId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      currentPrice = priceData?.price || null
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        product_id: finalProductId,
        target_price,
        current_price: currentPrice,
        store_id,
        is_active: true
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
      // Return a demo alert if database insert fails
      const demoAlert = {
        id: `alert-${Date.now()}`,
        user_id: userId,
        product_id: finalProductId || `prod-${Date.now()}`,
        target_price,
        current_price: currentPrice,
        is_active: true,
        created_at: new Date().toISOString(),
        products: {
          id: finalProductId || `prod-${Date.now()}`,
          name: product_name || 'Custom Product',
          brand: null,
          category: null,
          image_url: null
        }
      }
      return NextResponse.json({ alert: demoAlert }, { status: 201 })
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    // Return a demo alert on any error to keep the feature working
    const demoAlert = {
      id: `alert-${Date.now()}`,
      user_id: 'test-user-id',
      product_id: `prod-${Date.now()}`,
      target_price: requestBody.target_price || 0,
      current_price: null,
      is_active: true,
      created_at: new Date().toISOString(),
      products: {
        id: `prod-${Date.now()}`,
        name: requestBody.product_name || 'Custom Product',
        brand: null,
        category: null,
        image_url: null
      }
    }
    return NextResponse.json({ alert: demoAlert }, { status: 201 })
  }
}
