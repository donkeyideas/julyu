/**
 * POST /api/subscriptions/validate-promo — Validate a promo code
 * Body: { code: string, planSlug: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/subscriptions/promo-codes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, planSlug } = body as { code: string; planSlug: string }

    if (!code || !planSlug) {
      return NextResponse.json({ error: 'code and planSlug are required' }, { status: 400 })
    }

    const promo = await validatePromoCode(code, planSlug)

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description,
      },
    })
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid promo code',
    })
  }
}
