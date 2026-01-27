/**
 * Data Retention Manager
 * Enforces data retention policies by auto-deleting old records.
 * Run on a schedule (e.g., daily cron) or on-demand from admin.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

interface RetentionPolicy {
  table: string
  dateColumn: string
  retentionDays: number
  description: string
}

interface RetentionResult {
  table: string
  recordsDeleted: number
  retentionDays: number
  error?: string
}

// Default retention policies
const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    table: 'user_events',
    dateColumn: 'created_at',
    retentionDays: 365,
    description: 'Behavioral events older than 1 year',
  },
  {
    table: 'ai_conversations',
    dateColumn: 'updated_at',
    retentionDays: 180,
    description: 'AI conversations older than 6 months',
  },
  {
    table: 'llm_cache',
    dateColumn: 'expires_at',
    retentionDays: 0, // Delete expired cache immediately
    description: 'Expired LLM response cache',
  },
  {
    table: 'b2b_api_logs',
    dateColumn: 'created_at',
    retentionDays: 90,
    description: 'B2B API logs older than 90 days',
  },
  {
    table: 'notifications',
    dateColumn: 'created_at',
    retentionDays: 90,
    description: 'Notifications older than 90 days',
  },
]

/**
 * Run all retention policies and return results.
 */
export async function enforceRetentionPolicies(): Promise<{
  results: RetentionResult[]
  totalDeleted: number
}> {
  const results: RetentionResult[] = []
  let totalDeleted = 0

  for (const policy of RETENTION_POLICIES) {
    const result = await enforcePolicy(policy)
    results.push(result)
    totalDeleted += result.recordsDeleted
  }

  return { results, totalDeleted }
}

/**
 * Enforce a single retention policy.
 */
async function enforcePolicy(policy: RetentionPolicy): Promise<RetentionResult> {
  const supabase = createServiceRoleClient()

  const cutoffDate = new Date(
    Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000
  ).toISOString()

  try {
    // Count records to delete first
    const { count } = await supabase
      .from(policy.table)
      .select('*', { count: 'exact', head: true })
      .lt(policy.dateColumn, cutoffDate)

    const recordCount = count ?? 0

    if (recordCount === 0) {
      return { table: policy.table, recordsDeleted: 0, retentionDays: policy.retentionDays }
    }

    // Delete in batches to avoid timeouts
    const BATCH_SIZE = 1000
    let deleted = 0

    while (deleted < recordCount) {
      const { error } = await supabase
        .from(policy.table)
        .delete()
        .lt(policy.dateColumn, cutoffDate)
        .limit(BATCH_SIZE)

      if (error) {
        throw error
      }

      deleted += Math.min(BATCH_SIZE, recordCount - deleted)
    }

    // Log the retention action
    await supabase.from('data_retention_log').insert({
      table_name: policy.table,
      records_deleted: recordCount,
      retention_days: policy.retentionDays,
    })

    return { table: policy.table, recordsDeleted: recordCount, retentionDays: policy.retentionDays }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[DataRetention] Error processing ${policy.table}:`, message)
    return {
      table: policy.table,
      recordsDeleted: 0,
      retentionDays: policy.retentionDays,
      error: message,
    }
  }
}

/**
 * Get retention policy overview with current record counts.
 */
export async function getRetentionStatus(): Promise<{
  policies: Array<RetentionPolicy & { recordsAffected: number }>
  recentExecutions: Array<{
    table_name: string
    records_deleted: number
    retention_days: number
    executed_at: string
  }>
}> {
  const supabase = createServiceRoleClient()

  // Check how many records each policy would affect
  const policiesWithCounts = await Promise.all(
    RETENTION_POLICIES.map(async (policy) => {
      const cutoffDate = new Date(
        Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000
      ).toISOString()

      const { count } = await supabase
        .from(policy.table)
        .select('*', { count: 'exact', head: true })
        .lt(policy.dateColumn, cutoffDate)

      return { ...policy, recordsAffected: count ?? 0 }
    })
  )

  // Get recent executions
  const { data: executions } = await supabase
    .from('data_retention_log')
    .select('table_name, records_deleted, retention_days, executed_at')
    .order('executed_at', { ascending: false })
    .limit(20)

  const recentExecutions = (executions ?? []) as Array<{
    table_name: string
    records_deleted: number
    retention_days: number
    executed_at: string
  }>

  return { policies: policiesWithCounts, recentExecutions }
}
