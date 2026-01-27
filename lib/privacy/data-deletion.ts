/**
 * GDPR Data Deletion
 * Permanently deletes all user data (right to erasure).
 * Processes tables in dependency order to respect foreign keys.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { revokeAllConsent } from './consent-manager'

interface DeletionStep {
  table: string
  column: string // The column that references the user
  description: string
}

interface DeletionResult {
  table: string
  recordsDeleted: number
  error?: string
}

// Tables to delete, ordered by foreign key dependencies (children first)
const DELETION_STEPS: DeletionStep[] = [
  // AI & conversation data
  { table: 'ai_messages', column: 'user_id', description: 'AI conversation messages' },
  { table: 'ai_conversation_context', column: 'conversation_id', description: 'Conversation context' },
  { table: 'ai_feedback', column: 'user_id', description: 'AI feedback' },
  { table: 'ai_conversations', column: 'user_id', description: 'AI conversations' },

  // Receipt data
  { table: 'receipt_items', column: 'receipt_id', description: 'Receipt line items' },
  { table: 'receipts', column: 'user_id', description: 'Receipts' },

  // Shopping data
  { table: 'list_items', column: 'user_id', description: 'Shopping list items' },
  { table: 'list_outcomes', column: 'list_id', description: 'List outcomes' },
  { table: 'shopping_lists', column: 'user_id', description: 'Shopping lists' },

  // Alerts & budgets
  { table: 'price_alerts', column: 'user_id', description: 'Price alerts' },
  { table: 'user_budgets', column: 'user_id', description: 'Budgets' },
  { table: 'user_savings', column: 'user_id', description: 'Savings records' },

  // Meal plans
  { table: 'meal_plans', column: 'user_id', description: 'Meal plans' },

  // Social
  { table: 'friend_requests', column: 'from_user_id', description: 'Sent friend requests' },
  { table: 'friend_requests', column: 'to_user_id', description: 'Received friend requests' },
  { table: 'friends', column: 'user_id', description: 'Friend connections (as user)' },
  { table: 'friends', column: 'friend_id', description: 'Friend connections (as friend)' },
  { table: 'notifications', column: 'user_id', description: 'Notifications' },

  // Events & tracking
  { table: 'user_events', column: 'user_id', description: 'Behavioral events' },
  { table: 'ai_model_usage', column: 'user_id', description: 'AI usage logs' },
  { table: 'ai_training_data', column: 'user_id', description: 'AI training data' },

  // Consent (revoke, then delete)
  { table: 'user_consent', column: 'user_id', description: 'Consent records' },

  // Preferences
  { table: 'user_preferences', column: 'user_id', description: 'User preferences' },

  // User record (last)
  { table: 'users', column: 'id', description: 'User profile' },
]

/**
 * Delete all data for a user (GDPR right to erasure).
 * Returns detailed results for each table processed.
 */
export async function deleteUserData(userId: string): Promise<{
  success: boolean
  results: DeletionResult[]
  totalDeleted: number
}> {
  const supabase = createServiceRoleClient()
  const results: DeletionResult[] = []
  let totalDeleted = 0

  // First, revoke all consent
  await revokeAllConsent(userId)

  // Handle receipt_items specially — need receipt IDs first
  const { data: userReceipts } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', userId)

  const receiptIds = ((userReceipts ?? []) as Array<{ id: string }>).map(r => r.id)

  // Handle list_outcomes specially — need list IDs first
  const { data: userLists } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('user_id', userId)

  const listIds = ((userLists ?? []) as Array<{ id: string }>).map(l => l.id)

  // Handle ai_conversation_context specially — need conversation IDs first
  const { data: userConvos } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)

  const convoIds = ((userConvos ?? []) as Array<{ id: string }>).map(c => c.id)

  for (const step of DELETION_STEPS) {
    try {
      let deleteResult

      // Special handling for tables with indirect user references
      if (step.table === 'receipt_items' && step.column === 'receipt_id') {
        if (receiptIds.length === 0) {
          results.push({ table: step.table, recordsDeleted: 0 })
          continue
        }
        // Count first
        const { count } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
          .in('receipt_id', receiptIds)

        deleteResult = await supabase
          .from(step.table)
          .delete()
          .in('receipt_id', receiptIds)

        const deleted = count ?? 0
        results.push({ table: step.table, recordsDeleted: deleted })
        totalDeleted += deleted
        continue
      }

      if (step.table === 'list_outcomes' && step.column === 'list_id') {
        if (listIds.length === 0) {
          results.push({ table: step.table, recordsDeleted: 0 })
          continue
        }
        const { count } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
          .in('list_id', listIds)

        deleteResult = await supabase
          .from(step.table)
          .delete()
          .in('list_id', listIds)

        const deleted = count ?? 0
        results.push({ table: step.table, recordsDeleted: deleted })
        totalDeleted += deleted
        continue
      }

      if (step.table === 'ai_conversation_context' && step.column === 'conversation_id') {
        if (convoIds.length === 0) {
          results.push({ table: step.table, recordsDeleted: 0 })
          continue
        }
        const { count } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convoIds)

        deleteResult = await supabase
          .from(step.table)
          .delete()
          .in('conversation_id', convoIds)

        const deleted = count ?? 0
        results.push({ table: step.table, recordsDeleted: deleted })
        totalDeleted += deleted
        continue
      }

      // Standard deletion by user column
      const { count } = await supabase
        .from(step.table)
        .select('*', { count: 'exact', head: true })
        .eq(step.column, userId)

      const recordCount = count ?? 0

      if (recordCount > 0) {
        deleteResult = await supabase
          .from(step.table)
          .delete()
          .eq(step.column, userId)

        if (deleteResult.error) {
          throw deleteResult.error
        }
      }

      results.push({ table: step.table, recordsDeleted: recordCount })
      totalDeleted += recordCount
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[DataDeletion] Error deleting from ${step.table}:`, message)
      results.push({ table: step.table, recordsDeleted: 0, error: message })
    }
  }

  const hasErrors = results.some(r => r.error)

  return {
    success: !hasErrors,
    results,
    totalDeleted,
  }
}

/**
 * Check what data exists for a user before deletion (preview).
 */
export async function previewUserData(userId: string): Promise<{
  tables: Array<{ table: string; description: string; recordCount: number }>
  totalRecords: number
}> {
  const supabase = createServiceRoleClient()
  const tables: Array<{ table: string; description: string; recordCount: number }> = []
  let totalRecords = 0

  // Only check direct user_id tables for the preview
  const directTables = DELETION_STEPS.filter(
    s => s.column === 'user_id' || s.column === 'id'
  )

  for (const step of directTables) {
    try {
      const { count } = await supabase
        .from(step.table)
        .select('*', { count: 'exact', head: true })
        .eq(step.column, userId)

      const recordCount = count ?? 0
      if (recordCount > 0) {
        tables.push({ table: step.table, description: step.description, recordCount })
        totalRecords += recordCount
      }
    } catch {
      // Skip tables that don't exist or error
    }
  }

  return { tables, totalRecords }
}
