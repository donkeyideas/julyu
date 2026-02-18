import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient() as any

    // Fetch all analytics data in parallel
    const [
      userResult,
      comparisonsResult,
      receiptsResult,
      listsResult,
      alertsResult,
      savingsResult,
      conversationsResult,
      eventsResult,
      preferencesResult,
    ] = await Promise.all([
      // User details
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),

      // Price comparisons
      supabase
        .from('comparisons')
        .select('id, total_savings, total_spent, item_count, best_store, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Receipts
      supabase
        .from('receipts')
        .select('id, total_amount, tax_amount, purchase_date, ocr_status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Shopping lists
      supabase
        .from('shopping_lists')
        .select('id, name, created_at, updated_at, is_template')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Price alerts
      supabase
        .from('price_alerts')
        .select('id, target_price, current_price, is_active, triggered_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Monthly savings
      supabase
        .from('user_savings')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false })
        .limit(12),

      // AI conversations
      supabase
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // User events (recent activity)
      supabase
        .from('user_events')
        .select('id, event_type, event_data, session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),

      // User preferences
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ])

    const user = userResult.data
    const comparisons = comparisonsResult.data || []
    const receipts = receiptsResult.data || []
    const lists = listsResult.data || []
    const alerts = alertsResult.data || []
    const savings = savingsResult.data || []
    const conversations = conversationsResult.data || []
    const events = eventsResult.data || []
    const preferences = preferencesResult.data

    // Calculate summary stats
    const totalComparisons = comparisons.length
    const totalSavings = comparisons.reduce((sum: number, c: any) => sum + (parseFloat(c.total_savings) || 0), 0)
    const totalSpentFromComparisons = comparisons.reduce((sum: number, c: any) => sum + (parseFloat(c.total_spent) || 0), 0)
    const totalReceipts = receipts.length
    const totalReceiptAmount = receipts.reduce((sum: number, r: any) => sum + (parseFloat(r.total_amount) || 0), 0)
    const totalLists = lists.length
    const activeAlerts = alerts.filter((a: any) => a.is_active).length
    const totalAlerts = alerts.length
    const totalConversations = conversations.length

    // Determine most-used store from comparisons
    const storeCounts: Record<string, number> = {}
    comparisons.forEach((c: any) => {
      if (c.best_store) {
        storeCounts[c.best_store] = (storeCounts[c.best_store] || 0) + 1
      }
    })
    const favoriteStore = Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Get last activity timestamp
    const activityDates = [
      ...comparisons.map((c: any) => c.created_at),
      ...receipts.map((r: any) => r.created_at),
      ...lists.map((l: any) => l.updated_at || l.created_at),
      ...events.map((e: any) => e.created_at),
    ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const lastActivity = activityDates[0] || user?.last_login || null

    // Build activity timeline from events
    const recentActivity = events.slice(0, 20).map((e: any) => ({
      type: e.event_type,
      data: e.event_data,
      timestamp: e.created_at,
    }))

    // Get unique sessions count
    const uniqueSessions = new Set(events.map((e: any) => e.session_id).filter(Boolean)).size

    return NextResponse.json({
      user,
      preferences,
      summary: {
        totalComparisons,
        totalSavings: Math.round(totalSavings * 100) / 100,
        totalSpentFromComparisons: Math.round(totalSpentFromComparisons * 100) / 100,
        totalReceipts,
        totalReceiptAmount: Math.round(totalReceiptAmount * 100) / 100,
        totalLists,
        activeAlerts,
        totalAlerts,
        totalConversations,
        favoriteStore,
        lastActivity,
        uniqueSessions,
      },
      comparisons: comparisons.slice(0, 10),
      receipts: receipts.slice(0, 10),
      lists: lists.slice(0, 10),
      savings,
      recentActivity,
    })
  } catch (error: any) {
    console.error('[User Analytics] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
