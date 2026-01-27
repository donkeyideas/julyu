/**
 * GET /api/admin/ai-agents/pricing
 * Run pricing strategy analysis with AI recommendations.
 */

import { NextResponse } from 'next/server'
import { analyzePricingStrategy } from '@/lib/ai/agents/pricing-strategist'

export async function GET() {
  try {
    const analysis = await analyzePricingStrategy()
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[PricingStrategy] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze pricing' },
      { status: 500 }
    )
  }
}
