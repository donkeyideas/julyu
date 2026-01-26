import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, product_name, target_price, store_id } = body

    if (!target_price) {
      return NextResponse.json({ error: 'Target price is required' }, { status: 400 })
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

        if (productError) throw productError
        finalProductId = newProduct.id
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
        user_id: user.id,
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

    if (error) throw error

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
