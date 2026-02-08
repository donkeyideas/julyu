/**
 * GET /api/privacy/consent — Get user consent status
 * PUT /api/privacy/consent — Update consent preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUserConsent, updateBulkConsent, type ConsentType } from '@/lib/privacy/consent-manager'

export const dynamic = 'force-dynamic'

const VALID_CONSENT_TYPES: ConsentType[] = ['data_aggregation', 'ai_training', 'marketing', 'analytics']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consent = await getUserConsent(userId)
    return NextResponse.json({ consent })
  } catch (error) {
    console.error('[Privacy/Consent] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent status' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { consent } = body as { consent: Partial<Record<ConsentType, boolean>> }

    if (!consent || typeof consent !== 'object') {
      return NextResponse.json({ error: 'Invalid consent data' }, { status: 400 })
    }

    // Validate consent types
    for (const key of Object.keys(consent)) {
      if (!VALID_CONSENT_TYPES.includes(key as ConsentType)) {
        return NextResponse.json({ error: `Invalid consent type: ${key}` }, { status: 400 })
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const result = await updateBulkConsent(userId, consent, ipAddress)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Some consent updates failed', details: result.errors },
        { status: 500 }
      )
    }

    // Return updated consent
    const updated = await getUserConsent(userId)
    return NextResponse.json({ success: true, consent: updated })
  } catch (error) {
    console.error('[Privacy/Consent] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    )
  }
}
