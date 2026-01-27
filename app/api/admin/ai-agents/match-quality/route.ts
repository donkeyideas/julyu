/**
 * GET /api/admin/ai-agents/match-quality — Get pending reviews + stats
 * POST /api/admin/ai-agents/match-quality — Review a match (approve/reject/correct)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPendingReviews, reviewMatch, getMatchReviewStats } from '@/lib/ai/agents/match-reviewer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const maxConfidence = parseFloat(searchParams.get('maxConfidence') || '0.8')

    const [reviews, stats] = await Promise.all([
      getPendingReviews(limit, 0, maxConfidence),
      getMatchReviewStats(),
    ])

    return NextResponse.json({ reviews, stats })
  } catch (error) {
    console.error('[MatchQuality] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get match reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceTable, sourceId, action, correctedProductId } = body as {
      sourceTable: 'list_items' | 'receipt_items'
      sourceId: string
      action: 'approve' | 'reject' | 'correct'
      correctedProductId?: string
    }

    if (!sourceTable || !sourceId || !action) {
      return NextResponse.json({ error: 'sourceTable, sourceId, and action are required' }, { status: 400 })
    }

    if (action === 'correct' && !correctedProductId) {
      return NextResponse.json({ error: 'correctedProductId is required for correct action' }, { status: 400 })
    }

    const result = await reviewMatch(sourceTable, sourceId, action, correctedProductId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[MatchQuality] Review error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to review match' },
      { status: 500 }
    )
  }
}
