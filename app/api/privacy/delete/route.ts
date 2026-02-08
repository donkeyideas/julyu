/**
 * POST /api/privacy/delete — Preview data to be deleted
 * DELETE /api/privacy/delete — Permanently delete all user data (GDPR right to erasure)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deleteUserData, previewUserData } from '@/lib/privacy/data-deletion'

export const dynamic = 'force-dynamic'

/**
 * POST — Preview what data will be deleted.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preview = await previewUserData(userId)
    return NextResponse.json({ preview })
  } catch (error) {
    console.error('[Privacy/Delete] Preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview data' },
      { status: 500 }
    )
  }
}

/**
 * DELETE — Permanently delete all user data.
 * Requires confirmation token in body.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmation } = body as { confirmation?: string }

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Must send { "confirmation": "DELETE_MY_ACCOUNT" } to confirm deletion' },
        { status: 400 }
      )
    }

    const result = await deleteUserData(userId)

    return NextResponse.json({
      success: result.success,
      totalDeleted: result.totalDeleted,
      details: result.results,
    })
  } catch (error) {
    console.error('[Privacy/Delete] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete data' },
      { status: 500 }
    )
  }
}
