/**
 * Check Budget Tool
 * Lets the AI query the user's budget status.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ActionResult, ActionTool } from './types'

async function execute(
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const supabase = createServiceRoleClient() as any

  const category = params.category as string | undefined
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Get budget data
  let budgetQuery = supabase
    .from('user_budgets')
    .select('category, monthly_limit, current_spent')
    .eq('user_id', userId)
    .eq('month', currentMonth)

  if (category) {
    budgetQuery = budgetQuery.eq('category', category)
  }

  const { data: budgets } = await budgetQuery

  // Get overall preferences for monthly budget
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('budget_monthly')
    .eq('user_id', userId)
    .single()

  // Get recent receipts for this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data: receipts } = await supabase
    .from('receipts')
    .select('total_amount')
    .eq('user_id', userId)
    .eq('ocr_status', 'complete')
    .gte('purchase_date', monthStart)

  const receiptRows: Array<{ total_amount: number | null }> = receipts ?? []
  const totalSpentFromReceipts = receiptRows.reduce(
    (sum, r) => sum + (r.total_amount || 0),
    0
  )

  const budgetRows = budgets ?? []
  const overallBudget = (prefs as { budget_monthly?: number } | null)?.budget_monthly ?? null

  const budgetSummary: Record<string, unknown> = {
    month: currentMonth,
    totalSpentFromReceipts,
    overallBudget,
    remaining: overallBudget ? overallBudget - totalSpentFromReceipts : null,
    categories: budgetRows.map((b: { category: string | null; monthly_limit: number | null; current_spent: number | null }) => ({
      category: b.category || 'General',
      limit: b.monthly_limit,
      spent: b.current_spent,
      remaining: (b.monthly_limit || 0) - (b.current_spent || 0),
    })),
  }

  // Build message
  let message = `Budget status for ${currentMonth}:\n`

  if (overallBudget) {
    const remaining = overallBudget - totalSpentFromReceipts
    const pct = ((totalSpentFromReceipts / overallBudget) * 100).toFixed(0)
    message += `Overall: $${totalSpentFromReceipts.toFixed(2)} / $${overallBudget.toFixed(2)} (${pct}% used, $${remaining.toFixed(2)} remaining)`
    if (remaining < overallBudget * 0.2) {
      message += ' ⚠️ Budget is running low!'
    }
  } else {
    message += `Total spent: $${totalSpentFromReceipts.toFixed(2)} (no monthly budget set)`
  }

  if (budgetRows.length > 0) {
    message += '\n\nBy category:'
    for (const b of budgetRows as Array<{ category: string | null; monthly_limit: number | null; current_spent: number | null }>) {
      const cat = b.category || 'General'
      const spent = b.current_spent || 0
      const limit = b.monthly_limit || 0
      message += `\n  ${cat}: $${spent.toFixed(2)} / $${limit.toFixed(2)}`
    }
  }

  return {
    success: true,
    action: 'CHECK_BUDGET',
    message,
    data: budgetSummary,
  }
}

export const checkBudgetTool: ActionTool = {
  action: 'CHECK_BUDGET',
  description: 'Check the user\'s budget status for the current month',
  execute,
}
