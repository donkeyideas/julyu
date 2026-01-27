/**
 * GET    /api/admin/subscriptions/promo-codes — Get all promo codes
 * POST   /api/admin/subscriptions/promo-codes — Create a promo code
 * PUT    /api/admin/subscriptions/promo-codes — Update a promo code
 * DELETE /api/admin/subscriptions/promo-codes — Delete a promo code
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '@/lib/subscriptions/promo-codes'

export async function GET() {
  try {
    const codes = await getPromoCodes()
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('[Admin/PromoCodes] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = await createPromoCode(body)
    return NextResponse.json({ code })
  } catch (error) {
    console.error('[Admin/PromoCodes] Create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create promo code' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 })
    }

    const code = await updatePromoCode(id, updates)
    return NextResponse.json({ code })
  } catch (error) {
    console.error('[Admin/PromoCodes] Update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 })
    }

    await deletePromoCode(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin/PromoCodes] Delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}
