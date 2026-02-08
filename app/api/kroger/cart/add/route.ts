/**
 * Add Items to Kroger Cart Endpoint
 * Uses user's OAuth token to add items to their Kroger cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUserToken } from '@/lib/api/kroger-oauth'

export const dynamic = 'force-dynamic'

interface CartItem {
  productId: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { items } = body as { items: CartItem[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items array' },
        { status: 400 }
      )
    }

    // Get user's Kroger OAuth token
    const accessToken = await getUserToken(userId)

    if (!accessToken) {
      return NextResponse.json({
        error: 'Kroger account not connected',
        needsAuth: true
      }, { status: 401 })
    }

    // Add items to cart using Kroger API
    // Note: Kroger API requires items to be added to a specific store's cart
    // The API endpoint is: PUT /v1/cart/add
    const response = await fetch('https://api.kroger.com/v1/cart/add', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.map(item => ({
          upc: item.productId,
          quantity: item.quantity
        }))
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[KrogerCart] Add to cart failed:', error)

      // If token is invalid, user needs to re-authorize
      if (response.status === 401) {
        return NextResponse.json({
          error: 'Kroger authorization expired',
          needsAuth: true
        }, { status: 401 })
      }

      return NextResponse.json({
        error: 'Failed to add items to cart',
        details: error
      }, { status: response.status })
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      itemsAdded: items.length,
      cartUrl: 'https://www.kroger.com/cart',
      result
    })
  } catch (error: any) {
    console.error('[KrogerCart] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add items to cart' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Kroger OAuth token
    const accessToken = await getUserToken(userId)

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        needsAuth: true
      })
    }

    return NextResponse.json({
      connected: true,
      needsAuth: false
    })
  } catch (error: any) {
    console.error('[KrogerCart] Status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check connection status' },
      { status: 500 }
    )
  }
}
