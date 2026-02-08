/**
 * POST /api/ai/assistant/action
 * Execute AI-suggested actions (add to list, set alert, check budget, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { executeAction } from '@/lib/ai/tools'
import type { ActionType } from '@/lib/ai/tools'

export const dynamic = 'force-dynamic'

const VALID_ACTIONS: ActionType[] = [
  'ADD_TO_LIST',
  'SET_ALERT',
  'CHECK_BUDGET',
  'SEARCH_PRICES',
  'FIND_STORES',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, params } = body as { action: string; params: Record<string, unknown> }

    if (!action || !VALID_ACTIONS.includes(action as ActionType)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await executeAction(action as ActionType, params || {}, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI Action] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute action' },
      { status: 500 }
    )
  }
}
