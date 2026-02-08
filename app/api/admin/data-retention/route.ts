/**
 * GET /api/admin/data-retention — Get retention policy status
 * POST /api/admin/data-retention — Execute retention policies
 */

import { NextResponse } from 'next/server'
import { enforceRetentionPolicies, getRetentionStatus } from '@/lib/privacy/data-retention'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = await getRetentionStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('[DataRetention] Status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get retention status' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await enforceRetentionPolicies()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[DataRetention] Enforcement error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enforce retention policies' },
      { status: 500 }
    )
  }
}
