/**
 * GET /api/admin/ml/collect — Get training data statistics
 * POST /api/admin/ml/collect — Run training data collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { collectTrainingData, getTrainingDataStats } from '@/lib/ml/training-collector'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getTrainingDataStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[ML/Collect] Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get training data stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { days = 30, sources } = body as {
      days?: number
      sources?: Array<'product_matching' | 'receipt_ocr' | 'chat_quality' | 'alert_effectiveness' | 'substitution'>
    }

    const result = await collectTrainingData({ days, sources })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ML/Collect] Collection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to collect training data' },
      { status: 500 }
    )
  }
}
