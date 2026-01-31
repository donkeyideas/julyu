/**
 * GET /api/admin/analytics
 * Aggregated platform metrics for admin dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient() as any
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel
    const [
      usersResult,
      receiptsResult,
      receiptsRecentResult,
      ocrCompleteResult,
      ocrFailedResult,
      correctionsResult,
      aiUsageResult,
      eventsResult,
      listsResult,
      alertsResult,
      savingsResult,
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id, subscription_tier, created_at', { count: 'exact' }),

      // Total receipts
      supabase.from('receipts').select('id', { count: 'exact', head: true }),

      // Receipts in period
      supabase.from('receipts').select('id, ocr_status, ocr_confidence, created_at')
        .gte('created_at', cutoff),

      // OCR accuracy
      supabase.from('receipts').select('id', { count: 'exact', head: true })
        .eq('ocr_status', 'complete'),

      supabase.from('receipts').select('id', { count: 'exact', head: true })
        .eq('ocr_status', 'failed'),

      // User corrections
      supabase.from('receipt_items').select('id', { count: 'exact', head: true })
        .eq('user_corrected', true),

      // AI cost breakdown
      supabase.from('ai_model_usage').select('use_case, cost, input_tokens, output_tokens, success, created_at')
        .gte('created_at', cutoff),

      // User events
      supabase.from('user_events').select('event_type, created_at')
        .gte('created_at', cutoff),

      // Shopping lists
      supabase.from('shopping_lists').select('id', { count: 'exact', head: true }),

      // Active alerts
      supabase.from('price_alerts').select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Aggregate savings
      supabase.from('user_savings').select('total_saved')
        .gte('month', cutoff.substring(0, 7)),
    ])

    // Process users
    const users = (usersResult.data ?? []) as Array<{
      id: string; subscription_tier: string; created_at: string
    }>
    const newUsersInPeriod = users.filter(u => u.created_at >= cutoff).length
    const usersByTier = {
      free: users.filter(u => u.subscription_tier === 'free').length,
      premium: users.filter(u => u.subscription_tier === 'premium').length,
      enterprise: users.filter(u => u.subscription_tier === 'enterprise').length,
    }

    // Process receipts
    const recentReceipts = (receiptsRecentResult.data ?? []) as Array<{
      id: string; ocr_status: string | null; ocr_confidence: number | null; created_at: string
    }>

    // Receipt volume by day
    const receiptsByDay = new Map<string, number>()
    for (const r of recentReceipts) {
      const day = r.created_at.substring(0, 10)
      receiptsByDay.set(day, (receiptsByDay.get(day) || 0) + 1)
    }

    // OCR accuracy
    const ocrComplete = ocrCompleteResult.count ?? 0
    const ocrFailed = ocrFailedResult.count ?? 0
    const ocrTotal = ocrComplete + ocrFailed
    const ocrAccuracy = ocrTotal > 0 ? ocrComplete / ocrTotal : 0

    // User corrections rate
    const totalCorrections = correctionsResult.count ?? 0

    // AI costs
    const aiUsage = (aiUsageResult.data ?? []) as Array<{
      use_case: string | null; cost: number | null
      input_tokens: number | null; output_tokens: number | null
      success: boolean | null; created_at: string
    }>

    const aiCostByFeature = new Map<string, { cost: number; calls: number; failures: number }>()
    let totalAiCost = 0
    let totalAiCalls = 0
    for (const u of aiUsage) {
      const feature = u.use_case || 'unknown'
      const existing = aiCostByFeature.get(feature) || { cost: 0, calls: 0, failures: 0 }
      existing.cost += u.cost || 0
      existing.calls += 1
      if (u.success === false) existing.failures += 1
      aiCostByFeature.set(feature, existing)
      totalAiCost += u.cost || 0
      totalAiCalls += 1
    }

    // Event counts
    const events = (eventsResult.data ?? []) as Array<{ event_type: string; created_at: string }>
    const eventCounts = new Map<string, number>()
    for (const e of events) {
      eventCounts.set(e.event_type, (eventCounts.get(e.event_type) || 0) + 1)
    }

    // Aggregate savings
    const savingsRows = (savingsResult.data ?? []) as Array<{ total_saved: number | null }>
    const totalSavingsGenerated = savingsRows.reduce((s, r) => s + (r.total_saved || 0), 0)

    return NextResponse.json({
      period: { days, from: cutoff, to: new Date().toISOString() },
      users: {
        total: users.length,
        newInPeriod: newUsersInPeriod,
        byTier: usersByTier,
      },
      receipts: {
        total: receiptsResult.count ?? 0,
        inPeriod: recentReceipts.length,
        byDay: Object.fromEntries(receiptsByDay),
        ocrAccuracy,
        ocrComplete,
        ocrFailed,
        userCorrections: totalCorrections,
      },
      ai: {
        totalCost: totalAiCost,
        totalCalls: totalAiCalls,
        costByFeature: Object.fromEntries(aiCostByFeature),
        avgCostPerCall: totalAiCalls > 0 ? totalAiCost / totalAiCalls : 0,
      },
      engagement: {
        shoppingLists: listsResult.count ?? 0,
        activeAlerts: alertsResult.count ?? 0,
        totalSavingsGenerated,
        eventCounts: Object.fromEntries(eventCounts),
      },
    })
  } catch (error) {
    console.error('[AdminAnalytics] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}
