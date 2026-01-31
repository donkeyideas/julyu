/**
 * AI Context Builder
 * Assembles comprehensive user context for the AI assistant's system prompt.
 * Fetches: preferences, recent purchases, active lists, price alerts,
 * budget status, dietary restrictions, favorite stores, and spending patterns.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface UserContext {
  preferences: {
    dietaryRestrictions: string[]
    budgetMonthly: number | null
    budgetRemaining: number | null
    favoriteStores: string[]
    excludedRetailers: string[]
    householdSize: number | null
    maxStores: number | null
    maxDriveTime: number | null
  }
  recentPurchases: Array<{
    store: string
    total: number
    date: string
    itemCount: number
  }>
  activeListItems: string[]
  activeLists: Array<{ id: string; name: string; itemCount: number }>
  pendingAlerts: Array<{
    product: string
    targetPrice: number
    currentPrice: number | null
  }>
  spendingSummary: {
    totalThisMonth: number
    tripsThisMonth: number
    avgPerTrip: number
    totalLastMonth: number
    savingsThisMonth: number
  }
  conversationSummary: string | null
}

type ReceiptStoreRow = {
  name?: string | null
  retailer?: string | null
}

type ReceiptRow = {
  total_amount: number | null
  purchase_date: string | null
  ocr_result: unknown
  stores: ReceiptStoreRow | null
}

type AlertRow = {
  target_price: number
  current_price: number | null
  products: { name: string } | null
}

/**
 * Build full user context for the AI assistant.
 * All queries are parallelized for performance.
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const supabase = createServiceRoleClient() as any

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  // Run all queries in parallel
  const [
    prefsResult,
    receiptsResult,
    listsResult,
    alertsResult,
    budgetResult,
    savingsResult,
    lastMonthSavingsResult,
    contextResult,
  ] = await Promise.all([
    // 1. User preferences
    supabase
      .from('user_preferences')
      .select('dietary_restrictions, budget_monthly, favorite_stores, preferred_retailers, excluded_retailers, max_stores, max_drive_time')
      .eq('user_id', userId)
      .single(),

    // 2. Recent receipts (last 30 days)
    supabase
      .from('receipts')
      .select('total_amount, purchase_date, ocr_result, stores(name, retailer)')
      .eq('user_id', userId)
      .eq('ocr_status', 'complete')
      .gte('purchase_date', thirtyDaysAgo)
      .order('purchase_date', { ascending: false })
      .limit(15),

    // 3. Active shopping lists with items
    supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),

    // 4. Active price alerts
    supabase
      .from('price_alerts')
      .select('target_price, current_price, products(name)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(10),

    // 5. Current month budget
    supabase
      .from('user_budgets')
      .select('monthly_limit, current_spent')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single(),

    // 6. Current month savings
    supabase
      .from('user_savings')
      .select('total_spent, total_saved, trips_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single(),

    // 7. Last month savings (for comparison)
    supabase
      .from('user_savings')
      .select('total_spent, total_saved')
      .eq('user_id', userId)
      .eq('month', lastMonth)
      .single(),

    // 8. Latest conversation context summary
    supabase
      .from('ai_conversation_context')
      .select('context_data')
      .eq('context_type', 'summary')
      .order('updated_at', { ascending: false })
      .limit(1),
  ])

  // Process preferences
  const prefs = prefsResult.data
  const preferences = {
    dietaryRestrictions: (prefs?.dietary_restrictions as string[]) || [],
    budgetMonthly: (prefs as any)?.budget_monthly ?? budgetResult.data?.monthly_limit ?? null,
    budgetRemaining: budgetResult.data
      ? (budgetResult.data.monthly_limit || 0) - (budgetResult.data.current_spent || 0)
      : null,
    favoriteStores: (prefs?.favorite_stores as string[]) || (prefs?.preferred_retailers as string[]) || [],
    excludedRetailers: (prefs?.excluded_retailers as string[]) || [],
    householdSize: null as number | null,
    maxStores: prefs?.max_stores ?? null,
    maxDriveTime: prefs?.max_drive_time ?? null,
  }

  // Process receipts
  const receiptRows: ReceiptRow[] = receiptsResult.data ?? []
  const recentPurchases = receiptRows.map(r => {
    const ocrResult = r.ocr_result as { items?: unknown[] } | null
    return {
      store: r.stores?.name || r.stores?.retailer || 'Unknown Store',
      total: r.total_amount || 0,
      date: r.purchase_date || new Date().toISOString(),
      itemCount: Array.isArray(ocrResult?.items) ? ocrResult.items.length : 0,
    }
  })

  // Process active lists and their items
  const lists = listsResult.data ?? []
  let activeListItems: string[] = []
  const activeLists: Array<{ id: string; name: string; itemCount: number }> = []

  if (lists.length > 0) {
    const listIds = lists.map((l: { id: string }) => l.id)
    const { data: items } = await supabase
      .from('list_items')
      .select('list_id, user_input')
      .in('list_id', listIds)
      .limit(30)

    const itemRows: Array<{ list_id: string; user_input: string | null }> = items ?? []
    activeListItems = itemRows
      .map(i => i.user_input)
      .filter((input): input is string => Boolean(input))

    for (const list of lists) {
      const listRow = list as { id: string; name: string | null }
      const count = itemRows.filter((i: { list_id: string }) => i.list_id === listRow.id).length
      activeLists.push({
        id: listRow.id,
        name: listRow.name || 'Untitled List',
        itemCount: count,
      })
    }
  }

  // Process price alerts
  const alertRows: AlertRow[] = (alertsResult.data ?? []) as AlertRow[]
  const pendingAlerts = alertRows.map(a => ({
    product: a.products?.name || 'Unknown Product',
    targetPrice: a.target_price,
    currentPrice: a.current_price,
  }))

  // Process spending summary
  const savings = savingsResult.data
  const lastMonthSavings = lastMonthSavingsResult.data
  const thisMonthReceipts = receiptRows.filter(r => {
    if (!r.purchase_date) return false
    return r.purchase_date >= thisMonthStart
  })
  const totalThisMonth = savings?.total_spent
    ?? thisMonthReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const tripsThisMonth = savings?.trips_count ?? thisMonthReceipts.length

  const spendingSummary = {
    totalThisMonth,
    tripsThisMonth,
    avgPerTrip: tripsThisMonth > 0 ? totalThisMonth / tripsThisMonth : 0,
    totalLastMonth: lastMonthSavings?.total_spent ?? 0,
    savingsThisMonth: savings?.total_saved ?? 0,
  }

  // Conversation summary
  const contextRows = contextResult.data ?? []
  const conversationSummary = contextRows.length > 0
    ? ((contextRows[0] as { context_data: { summary?: string } }).context_data?.summary ?? null)
    : null

  return {
    preferences,
    recentPurchases,
    activeListItems,
    activeLists,
    pendingAlerts,
    spendingSummary,
    conversationSummary,
  }
}

/**
 * Format user context into a system prompt section.
 * This is injected into the shopping assistant prompt template.
 */
export function formatContextForPrompt(context: UserContext): string {
  const sections: string[] = []

  // Preferences
  const { preferences } = context
  if (preferences.dietaryRestrictions.length > 0) {
    sections.push(`Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}`)
    sections.push('IMPORTANT: Never suggest products that violate these restrictions.')
  }

  if (preferences.householdSize) {
    sections.push(`Household size: ${preferences.householdSize} people`)
  }

  // Budget
  if (preferences.budgetMonthly) {
    let budgetLine = `Monthly grocery budget: $${preferences.budgetMonthly}`
    if (preferences.budgetRemaining !== null) {
      budgetLine += ` | Remaining: $${preferences.budgetRemaining.toFixed(2)}`
      if (preferences.budgetRemaining < preferences.budgetMonthly * 0.2) {
        budgetLine += ' (LOW — warn user about budget)'
      }
    }
    sections.push(budgetLine)
  }

  // Stores
  if (preferences.favoriteStores.length > 0) {
    sections.push(`Preferred stores: ${preferences.favoriteStores.join(', ')}`)
  }
  if (preferences.excludedRetailers.length > 0) {
    sections.push(`Excluded stores: ${preferences.excludedRetailers.join(', ')} (never recommend)`)
  }

  // Spending summary
  const { spendingSummary } = context
  if (spendingSummary.totalThisMonth > 0) {
    const lines = [
      `This month: $${spendingSummary.totalThisMonth.toFixed(2)} spent across ${spendingSummary.tripsThisMonth} trips`,
      `Avg per trip: $${spendingSummary.avgPerTrip.toFixed(2)}`,
    ]
    if (spendingSummary.totalLastMonth > 0) {
      const diff = spendingSummary.totalThisMonth - spendingSummary.totalLastMonth
      const direction = diff > 0 ? 'more' : 'less'
      lines.push(`Compared to last month: $${Math.abs(diff).toFixed(2)} ${direction}`)
    }
    if (spendingSummary.savingsThisMonth > 0) {
      lines.push(`Savings this month: $${spendingSummary.savingsThisMonth.toFixed(2)}`)
    }
    sections.push(`Spending: ${lines.join(' | ')}`)
  }

  // Recent purchases
  if (context.recentPurchases.length > 0) {
    const receiptsInfo = context.recentPurchases.slice(0, 5).map(r =>
      `${r.store} ($${r.total.toFixed(2)} on ${new Date(r.date).toLocaleDateString()}, ${r.itemCount} items)`
    ).join('; ')
    sections.push(`Recent shopping: ${receiptsInfo}`)
  }

  // Active lists
  if (context.activeLists.length > 0) {
    const listsInfo = context.activeLists.map(l =>
      `"${l.name}" (${l.itemCount} items)`
    ).join(', ')
    sections.push(`Active shopping lists: ${listsInfo}`)
  }
  if (context.activeListItems.length > 0) {
    sections.push(`Items on lists: ${context.activeListItems.slice(0, 20).join(', ')}`)
  }

  // Price alerts
  if (context.pendingAlerts.length > 0) {
    const alertsInfo = context.pendingAlerts.map(a => {
      let line = `${a.product} (target: $${a.targetPrice.toFixed(2)}`
      if (a.currentPrice !== null) {
        line += `, current: $${a.currentPrice.toFixed(2)}`
        if (a.currentPrice <= a.targetPrice) {
          line += ' — TRIGGERED!'
        }
      }
      return line + ')'
    }).join('; ')
    sections.push(`Price alerts: ${alertsInfo}`)
  }

  // Conversation summary
  if (context.conversationSummary) {
    sections.push(`Previous conversation context: ${context.conversationSummary}`)
  }

  if (sections.length === 0) {
    return ''
  }

  return '\n--- USER CONTEXT ---\n' + sections.join('\n') + '\n--- END CONTEXT ---\n'
}
