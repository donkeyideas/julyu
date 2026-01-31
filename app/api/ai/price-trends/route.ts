/**
 * GET /api/ai/price-trends?productId=...&days=90
 * POST /api/ai/price-trends (batch: { productIds: string[] })
 * Returns price trend analysis with AI-generated explanations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { analyzePriceTrend, batchAnalyzePriceTrends } from '@/lib/ai/price-predictor'
import { explainPriceTrend } from '@/lib/ai/price-explainer'
import { hasFeature } from '@/lib/subscriptions/feature-gate'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeature(userId, 'advanced_analytics')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const days = parseInt(searchParams.get('days') || '90', 10)

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const trend = await analyzePriceTrend(productId, days)

    if (!trend) {
      return NextResponse.json({ error: 'Product not found or no price data' }, { status: 404 })
    }

    // Generate AI explanation
    const explanation = await explainPriceTrend({
      productName: trend.productName,
      brand: trend.brand,
      currentPrice: trend.currentPrice,
      stats: trend.stats,
      trend: trend.trend,
      prediction: trend.prediction,
      seasonality: trend.seasonality,
    }, userId)

    return NextResponse.json({
      ...trend,
      explanation,
    })
  } catch (error) {
    console.error('[PriceTrends] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze trends' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeature(userId, 'advanced_analytics')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const body = await request.json()
    const { productIds, days = 90 } = body as { productIds: string[]; days?: number }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds array is required' }, { status: 400 })
    }

    const trends = await batchAnalyzePriceTrends(productIds, days)

    return NextResponse.json({
      trends,
      totalProducts: productIds.length,
      analyzedProducts: trends.length,
    })
  } catch (error) {
    console.error('[PriceTrends] Batch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze trends' },
      { status: 500 }
    )
  }
}
