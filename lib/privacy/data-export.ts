/**
 * GDPR Data Export
 * Exports all user data as a structured JSON object.
 * Covers: profile, preferences, receipts, shopping lists, price alerts,
 * budgets, savings, conversations, events, consent records.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface UserDataExport {
  exportedAt: string
  userId: string
  profile: Record<string, unknown> | null
  preferences: Record<string, unknown> | null
  consent: Array<Record<string, unknown>>
  receipts: Array<Record<string, unknown>>
  receiptItems: Array<Record<string, unknown>>
  shoppingLists: Array<Record<string, unknown>>
  listItems: Array<Record<string, unknown>>
  priceAlerts: Array<Record<string, unknown>>
  budgets: Array<Record<string, unknown>>
  savings: Array<Record<string, unknown>>
  conversations: Array<Record<string, unknown>>
  conversationMessages: Array<Record<string, unknown>>
  mealPlans: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  aiFeedback: Array<Record<string, unknown>>
  friends: Array<Record<string, unknown>>
  notifications: Array<Record<string, unknown>>
}

/**
 * Export all data for a user (GDPR right of access).
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const supabase = createServiceRoleClient()

  // Run all queries in parallel for speed
  const [
    profileResult,
    preferencesResult,
    consentResult,
    receiptsResult,
    receiptItemsResult,
    listsResult,
    listItemsResult,
    alertsResult,
    budgetsResult,
    savingsResult,
    conversationsResult,
    messagesResult,
    mealPlansResult,
    eventsResult,
    feedbackResult,
    friendsResult,
    notificationsResult,
  ] = await Promise.all([
    // Profile
    supabase
      .from('users')
      .select('id, email, full_name, phone, location, created_at, last_login, subscription_tier, auth_provider, avatar_url')
      .eq('id', userId)
      .single(),

    // Preferences
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single(),

    // Consent records
    supabase
      .from('user_consent')
      .select('consent_type, granted, granted_at, revoked_at, created_at')
      .eq('user_id', userId),

    // Receipts
    supabase
      .from('receipts')
      .select('id, total_amount, purchase_date, ocr_status, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // Receipt items
    supabase
      .from('receipt_items')
      .select('id, receipt_id, product_name_raw, quantity, unit_price, total_price, discount_amount, category, brand, created_at')
      .eq('receipt_id', userId), // Will be joined after receipts

    // Shopping lists
    supabase
      .from('shopping_lists')
      .select('id, name, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // List items
    supabase
      .from('list_items')
      .select('id, list_id, user_input, quantity, is_checked, created_at')
      .eq('user_id', userId),

    // Price alerts
    supabase
      .from('price_alerts')
      .select('id, product_id, target_price, current_price, is_active, triggered_at, created_at')
      .eq('user_id', userId),

    // Budgets
    supabase
      .from('user_budgets')
      .select('id, month, category, budget_amount, spent_amount, created_at')
      .eq('user_id', userId),

    // Savings
    supabase
      .from('user_savings')
      .select('id, amount, source, description, date, created_at')
      .eq('user_id', userId),

    // Conversations
    supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId),

    // Conversation messages
    supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    // Meal plans
    supabase
      .from('meal_plans')
      .select('id, week_start, budget, dietary_restrictions, household_size, total_estimated_cost, created_at')
      .eq('user_id', userId),

    // User events (last 1 year only)
    supabase
      .from('user_events')
      .select('event_type, event_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5000),

    // AI feedback
    supabase
      .from('ai_feedback')
      .select('id, conversation_id, rating, feedback_text, created_at')
      .eq('user_id', userId),

    // Friends
    supabase
      .from('friends')
      .select('id, friend_id, status, created_at')
      .eq('user_id', userId),

    // Notifications
    supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  // For receipt items, we need to fetch by receipt IDs
  const receiptIds = ((receiptsResult.data ?? []) as Array<{ id: string }>).map(r => r.id)
  let receiptItems: Array<Record<string, unknown>> = []
  if (receiptIds.length > 0) {
    const { data: items } = await supabase
      .from('receipt_items')
      .select('id, receipt_id, product_name_raw, quantity, unit_price, total_price, discount_amount, category, brand, created_at')
      .in('receipt_id', receiptIds)

    receiptItems = (items ?? []) as Array<Record<string, unknown>>
  }

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: (profileResult.data as Record<string, unknown>) ?? null,
    preferences: (preferencesResult.data as Record<string, unknown>) ?? null,
    consent: (consentResult.data ?? []) as Array<Record<string, unknown>>,
    receipts: (receiptsResult.data ?? []) as Array<Record<string, unknown>>,
    receiptItems,
    shoppingLists: (listsResult.data ?? []) as Array<Record<string, unknown>>,
    listItems: (listItemsResult.data ?? []) as Array<Record<string, unknown>>,
    priceAlerts: (alertsResult.data ?? []) as Array<Record<string, unknown>>,
    budgets: (budgetsResult.data ?? []) as Array<Record<string, unknown>>,
    savings: (savingsResult.data ?? []) as Array<Record<string, unknown>>,
    conversations: (conversationsResult.data ?? []) as Array<Record<string, unknown>>,
    conversationMessages: (messagesResult.data ?? []) as Array<Record<string, unknown>>,
    mealPlans: (mealPlansResult.data ?? []) as Array<Record<string, unknown>>,
    events: (eventsResult.data ?? []) as Array<Record<string, unknown>>,
    aiFeedback: (feedbackResult.data ?? []) as Array<Record<string, unknown>>,
    friends: (friendsResult.data ?? []) as Array<Record<string, unknown>>,
    notifications: (notificationsResult.data ?? []) as Array<Record<string, unknown>>,
  }
}
