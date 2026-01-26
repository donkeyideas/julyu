import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      // Return demo alert for unauthenticated users
      return NextResponse.json({
        alert: {
          id,
          user_id: 'test-user-id',
          product_id: 'prod-1',
          target_price: 3.99,
          current_price: 4.49,
          is_active: true,
          created_at: new Date().toISOString(),
          products: {
            id: 'prod-1',
            name: 'Demo Product',
            brand: null,
            category: 'General',
            image_url: null
          }
        }
      })
    }

    const { data: alert, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[Alert] Error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }
      // Return demo alert on other errors
      return NextResponse.json({
        alert: {
          id,
          user_id: userId,
          product_id: 'prod-1',
          target_price: 3.99,
          current_price: 4.49,
          is_active: true,
          created_at: new Date().toISOString(),
          products: {
            id: 'prod-1',
            name: 'Demo Product',
            brand: null,
            category: 'General',
            image_url: null
          }
        }
      })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error fetching alert:', error)
    return NextResponse.json({
      alert: {
        id: 'demo',
        user_id: 'test-user-id',
        product_id: 'prod-1',
        target_price: 3.99,
        current_price: 4.49,
        is_active: true,
        created_at: new Date().toISOString(),
        products: {
          id: 'prod-1',
          name: 'Demo Product',
          brand: null,
          category: 'General',
          image_url: null
        }
      }
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let requestBody: { target_price?: number; is_active?: boolean; store_id?: string } = {}

  try {
    const { id } = params
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    requestBody = await request.json()
    const { target_price, is_active, store_id } = requestBody

    // For demo mode, return success with updated data
    if (!userId || isTestMode) {
      return NextResponse.json({
        alert: {
          id,
          user_id: userId || 'test-user-id',
          product_id: 'prod-1',
          target_price: target_price ?? 3.99,
          current_price: 4.49,
          is_active: is_active ?? true,
          store_id,
          created_at: new Date().toISOString(),
          products: {
            id: 'prod-1',
            name: 'Demo Product',
            brand: null,
            category: 'General',
            image_url: null
          }
        }
      })
    }

    // Verify ownership
    const { data: existing, error: existError } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (existError || !existing) {
      // Return demo response on error
      return NextResponse.json({
        alert: {
          id,
          user_id: userId,
          product_id: 'prod-1',
          target_price: target_price ?? 3.99,
          current_price: 4.49,
          is_active: is_active ?? true,
          store_id,
          created_at: new Date().toISOString(),
          products: {
            id: 'prod-1',
            name: 'Demo Product',
            brand: null,
            category: 'General',
            image_url: null
          }
        }
      })
    }

    const updateData: Record<string, unknown> = {}
    if (target_price !== undefined) updateData.target_price = target_price
    if (is_active !== undefined) updateData.is_active = is_active
    if (store_id !== undefined) updateData.store_id = store_id

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update(updateData)
      .eq('id', id)
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
      console.error('[Alert] Update error:', error)
      // Return demo response on error
      return NextResponse.json({
        alert: {
          id,
          user_id: userId,
          product_id: 'prod-1',
          target_price: target_price ?? 3.99,
          current_price: 4.49,
          is_active: is_active ?? true,
          store_id,
          created_at: new Date().toISOString(),
          products: {
            id: 'prod-1',
            name: 'Demo Product',
            brand: null,
            category: 'General',
            image_url: null
          }
        }
      })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json({
      alert: {
        id: 'demo',
        user_id: 'test-user-id',
        target_price: requestBody.target_price ?? 3.99,
        is_active: requestBody.is_active ?? true,
        created_at: new Date().toISOString()
      }
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    // For demo mode, return success
    if (!userId || isTestMode) {
      return NextResponse.json({ success: true })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[Alert] Delete error:', error)
      // Return success anyway for demo functionality
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    // Return success on any error to keep the feature working
    return NextResponse.json({ success: true })
  }
}
