/**
 * GET /api/admin/ml/evaluate — Get evaluation history
 * POST /api/admin/ml/evaluate — Run evaluation suite
 */

import { NextRequest, NextResponse } from 'next/server'
import { runEvaluationSuite, evaluateTask, getEvaluationHistory } from '@/lib/ml/evaluation'

export async function GET() {
  try {
    const history = await getEvaluationHistory()
    return NextResponse.json({ history })
  } catch (error) {
    console.error('[ML/Evaluate] History error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get evaluation history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskType, sampleSize = 50 } = body as {
      taskType?: string
      sampleSize?: number
    }

    if (taskType) {
      // Evaluate a specific task type
      const result = await evaluateTask({ taskType, sampleSize })
      return NextResponse.json({ result })
    }

    // Run full evaluation suite
    const suite = await runEvaluationSuite(sampleSize)
    return NextResponse.json(suite)
  } catch (error) {
    console.error('[ML/Evaluate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run evaluation' },
      { status: 500 }
    )
  }
}
