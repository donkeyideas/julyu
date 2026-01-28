import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/auth/ensure-user'
import { spoonacularClient } from '@/lib/api/spoonacular'

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

    const dbClient = createServiceRoleClient()

    // Fetch all active alerts with product info
    const { data: alerts, error: fetchError } = await dbClient
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

    if (fetchError) {
      console.error('[Alerts Refresh] Failed to fetch alerts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ alerts: [], refreshed_count: 0, prices_found: 0 })
    }

    const errors: string[] = []
    let pricesFound = 0
    let refreshedCount = 0
    const now = new Date().toISOString()

    // Check if Spoonacular is available
    let spoonacularAvailable = false
    try {
      spoonacularAvailable = await spoonacularClient.isConfiguredAsync()
    } catch {
      errors.push('Spoonacular API not configured')
    }

    for (const alert of alerts) {
      const productName = alert.products?.name
      if (!productName) continue

      let newPrice: number | null = null

      // Try DB prices first
      if (alert.product_id) {
        const { data: priceData } = await dbClient
          .from('prices')
          .select('price')
          .eq('product_id', alert.product_id)
          .order('effective_date', { ascending: false })
          .limit(1)
          .single()

        if (priceData?.price != null) {
          newPrice = priceData.price
        }
      }

      // Try Spoonacular if no DB price
      if (newPrice === null && spoonacularAvailable) {
        try {
          const results = await spoonacularClient.searchGroceryProducts(productName, { number: 1 })
          if (results.length > 0 && results[0].price != null) {
            newPrice = results[0].price
          }
        } catch (e) {
          console.error(`[Alerts Refresh] Spoonacular failed for "${productName}":`, e)
        }
      }

      // Update the alert
      const updateData: Record<string, unknown> = {
        last_checked_at: now,
      }

      if (newPrice !== null) {
        pricesFound++
        updateData.current_price = newPrice

        // Track lowest price found
        if (alert.lowest_price_found === null || newPrice < alert.lowest_price_found) {
          updateData.lowest_price_found = newPrice
        }

        // Check if price dropped to or below target
        if (newPrice <= alert.target_price) {
          updateData.triggered_at = alert.triggered_at || now
        }
      }

      await dbClient
        .from('price_alerts')
        .update(updateData)
        .eq('id', alert.id)

      refreshedCount++
    }

    // Re-fetch updated alerts
    const { data: updatedAlerts } = await dbClient
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

    return NextResponse.json({
      alerts: updatedAlerts || [],
      refreshed_count: refreshedCount,
      prices_found: pricesFound,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Alerts Refresh] Error:', error)
    return NextResponse.json({ error: 'Failed to refresh prices' }, { status: 500 })
  }
}
