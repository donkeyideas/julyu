/**
 * GET /api/admin/ai-agents/data-quality
 * Runs data quality checks and returns a report.
 */

import { NextResponse } from 'next/server'
import { runDataQualityChecks } from '@/lib/ai/agents/data-quality'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await runDataQualityChecks()
    return NextResponse.json(report)
  } catch (error) {
    console.error('[DataQuality] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run quality checks' },
      { status: 500 }
    )
  }
}
