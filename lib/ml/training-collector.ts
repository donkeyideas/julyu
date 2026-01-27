/**
 * Structured Training Data Collector
 * Captures labeled training pairs from different sources:
 * - Product matching: OCR text → matched product (with user corrections)
 * - Receipt OCR: image → extracted data (with user corrections)
 * - Chat: conversation → rating → quality label
 * - Price alerts: alert → user action → effectiveness label
 * - Substitutions: original → substitute → acceptance
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

// ============================================
// Types
// ============================================

export type TrainingSource =
  | 'product_matching'
  | 'receipt_ocr'
  | 'chat_quality'
  | 'alert_effectiveness'
  | 'substitution'

interface TrainingPair {
  source: TrainingSource
  input: string
  output: string
  label: 'positive' | 'negative' | 'neutral'
  confidence: number
  metadata: Record<string, unknown>
}

interface CollectionResult {
  source: TrainingSource
  collected: number
  errors: number
}

// ============================================
// Collector Functions
// ============================================

/**
 * Collect training pairs from user-corrected product matches.
 * Gold data: user corrected the AI's match.
 */
async function collectProductMatchCorrections(
  sinceDate: string
): Promise<TrainingPair[]> {
  const supabase = createServiceRoleClient()
  const pairs: TrainingPair[] = []

  // From receipt_items where user corrected the match
  const { data: receiptCorrections } = await supabase
    .from('receipt_items')
    .select('product_name_raw, matched_product_id, match_confidence, user_corrected, created_at')
    .eq('user_corrected', true)
    .gte('created_at', sinceDate)

  const correctedItems = (receiptCorrections ?? []) as Array<{
    product_name_raw: string
    matched_product_id: string | null
    match_confidence: number | null
    user_corrected: boolean
    created_at: string
  }>

  for (const item of correctedItems) {
    if (item.matched_product_id) {
      // Get the corrected product name
      const { data: product } = await supabase
        .from('products')
        .select('name, brand')
        .eq('id', item.matched_product_id)
        .single()

      const productData = product as { name: string; brand: string | null } | null
      if (productData) {
        pairs.push({
          source: 'product_matching',
          input: item.product_name_raw,
          output: `${productData.name}${productData.brand ? ` (${productData.brand})` : ''}`,
          label: 'positive', // User confirmed this is the correct match
          confidence: 1.0,
          metadata: {
            original_confidence: item.match_confidence,
            product_id: item.matched_product_id,
            corrected_at: item.created_at,
          },
        })
      }
    }
  }

  // Also collect from existing ai_training_data with product_match corrections
  const { data: trainingCorrections } = await supabase
    .from('ai_training_data')
    .select('input_text, output_text, metadata, created_at')
    .gte('created_at', sinceDate)

  const trainingRows = (trainingCorrections ?? []) as Array<{
    input_text: string | null
    output_text: string | null
    metadata: { type?: string } | null
    created_at: string
  }>

  for (const row of trainingRows) {
    if (
      row.metadata?.type === 'product_match_correction' &&
      row.input_text &&
      row.output_text
    ) {
      pairs.push({
        source: 'product_matching',
        input: row.input_text,
        output: row.output_text,
        label: 'positive',
        confidence: 1.0,
        metadata: { from_training_table: true, created_at: row.created_at },
      })
    }
  }

  return pairs
}

/**
 * Collect training pairs from chat conversations with user ratings.
 */
async function collectChatQuality(sinceDate: string): Promise<TrainingPair[]> {
  const supabase = createServiceRoleClient()
  const pairs: TrainingPair[] = []

  // Get feedback with conversation data
  const { data: feedback } = await supabase
    .from('ai_feedback')
    .select('conversation_id, rating, comment, interaction_type, feedback_type')
    .gte('created_at', sinceDate)

  const feedbackRows = (feedback ?? []) as Array<{
    conversation_id: string | null
    rating: number | null
    comment: string | null
    interaction_type: string | null
    feedback_type: string | null
  }>

  for (const fb of feedbackRows) {
    if (!fb.conversation_id) continue

    // Get the last user message and assistant response from this conversation
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', fb.conversation_id)
      .order('created_at', { ascending: false })
      .limit(4)

    const msgRows = (messages ?? []) as Array<{ role: string; content: string }>
    const lastAssistant = msgRows.find(m => m.role === 'assistant')
    const lastUser = msgRows.find(m => m.role === 'user')

    if (lastUser && lastAssistant) {
      const label = fb.rating !== null
        ? fb.rating >= 4 ? 'positive' : fb.rating <= 2 ? 'negative' : 'neutral'
        : fb.feedback_type === 'positive' ? 'positive'
        : fb.feedback_type === 'negative' ? 'negative'
        : 'neutral'

      pairs.push({
        source: 'chat_quality',
        input: lastUser.content,
        output: lastAssistant.content,
        label,
        confidence: fb.rating !== null ? fb.rating / 5 : 0.5,
        metadata: {
          conversation_id: fb.conversation_id,
          rating: fb.rating,
          comment: fb.comment,
        },
      })
    }
  }

  return pairs
}

/**
 * Collect training pairs from price alert effectiveness.
 */
async function collectAlertEffectiveness(sinceDate: string): Promise<TrainingPair[]> {
  const supabase = createServiceRoleClient()
  const pairs: TrainingPair[] = []

  // Get triggered alerts and whether the user acted on them
  const { data: events } = await supabase
    .from('user_events')
    .select('event_type, event_data, created_at')
    .in('event_type', ['price_alert_triggered', 'price_alert_acted_on'])
    .gte('created_at', sinceDate)

  const eventRows = (events ?? []) as Array<{
    event_type: string
    event_data: { alert_id?: string; product_name?: string; target_price?: number; current_price?: number } | null
    created_at: string
  }>

  // Group by alert_id
  const alertEvents = new Map<string, { triggered: boolean; acted: boolean; data: typeof eventRows[0]['event_data'] }>()

  for (const event of eventRows) {
    const alertId = event.event_data?.alert_id
    if (!alertId) continue

    const existing = alertEvents.get(alertId) || { triggered: false, acted: false, data: event.event_data }
    if (event.event_type === 'price_alert_triggered') existing.triggered = true
    if (event.event_type === 'price_alert_acted_on') existing.acted = true
    alertEvents.set(alertId, existing)
  }

  for (const [alertId, info] of alertEvents) {
    if (!info.triggered || !info.data) continue

    pairs.push({
      source: 'alert_effectiveness',
      input: JSON.stringify({
        product: info.data.product_name,
        target_price: info.data.target_price,
        current_price: info.data.current_price,
      }),
      output: info.acted ? 'acted_on' : 'ignored',
      label: info.acted ? 'positive' : 'neutral',
      confidence: 1.0,
      metadata: { alert_id: alertId },
    })
  }

  return pairs
}

/**
 * Collect training pairs from product substitutions.
 */
async function collectSubstitutions(sinceDate: string): Promise<TrainingPair[]> {
  const supabase = createServiceRoleClient()
  const pairs: TrainingPair[] = []

  const { data: outcomes } = await supabase
    .from('list_outcomes')
    .select('planned_product_id, actual_product_id, was_substituted, substitution_reason, created_at')
    .eq('was_substituted', true)
    .gte('created_at', sinceDate)

  const outcomeRows = (outcomes ?? []) as Array<{
    planned_product_id: string | null
    actual_product_id: string | null
    was_substituted: boolean
    substitution_reason: string | null
    created_at: string
  }>

  for (const outcome of outcomeRows) {
    if (!outcome.planned_product_id || !outcome.actual_product_id) continue

    // Get product names
    const { data: products } = await supabase
      .from('products')
      .select('id, name, brand')
      .in('id', [outcome.planned_product_id, outcome.actual_product_id])

    const productRows = (products ?? []) as Array<{ id: string; name: string; brand: string | null }>
    const planned = productRows.find(p => p.id === outcome.planned_product_id)
    const actual = productRows.find(p => p.id === outcome.actual_product_id)

    if (planned && actual) {
      pairs.push({
        source: 'substitution',
        input: `${planned.name}${planned.brand ? ` (${planned.brand})` : ''}`,
        output: `${actual.name}${actual.brand ? ` (${actual.brand})` : ''}`,
        label: 'positive', // User accepted this substitution
        confidence: 0.8,
        metadata: {
          reason: outcome.substitution_reason,
          created_at: outcome.created_at,
        },
      })
    }
  }

  return pairs
}

// ============================================
// Main Collection Orchestrator
// ============================================

/**
 * Run all training data collectors and store results.
 */
export async function collectTrainingData(
  options: { days?: number; sources?: TrainingSource[] } = {}
): Promise<{
  results: CollectionResult[]
  totalPairs: number
  storedCount: number
}> {
  const days = options.days ?? 30
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const sources = options.sources ?? [
    'product_matching',
    'chat_quality',
    'alert_effectiveness',
    'substitution',
  ]

  const results: CollectionResult[] = []
  const allPairs: TrainingPair[] = []

  const collectors: Record<TrainingSource, () => Promise<TrainingPair[]>> = {
    product_matching: () => collectProductMatchCorrections(sinceDate),
    receipt_ocr: async () => [], // OCR corrections collected via product_matching path
    chat_quality: () => collectChatQuality(sinceDate),
    alert_effectiveness: () => collectAlertEffectiveness(sinceDate),
    substitution: () => collectSubstitutions(sinceDate),
  }

  for (const source of sources) {
    try {
      const pairs = await collectors[source]()
      allPairs.push(...pairs)
      results.push({ source, collected: pairs.length, errors: 0 })
    } catch (error) {
      console.error(`[TrainingCollector] Error collecting ${source}:`, error)
      results.push({ source, collected: 0, errors: 1 })
    }
  }

  // Store collected pairs in ai_training_data
  const supabase = createServiceRoleClient()
  let storedCount = 0

  for (const pair of allPairs) {
    const { error } = await supabase.from('ai_training_data').insert({
      input_text: pair.input,
      output_text: pair.output,
      use_case: pair.source,
      user_feedback: pair.label,
      accuracy_score: pair.confidence,
      metadata: pair.metadata,
    })

    if (!error) storedCount++
  }

  return { results, totalPairs: allPairs.length, storedCount }
}

/**
 * Get training data statistics by source.
 */
export async function getTrainingDataStats(): Promise<{
  total: number
  bySource: Record<string, number>
  byLabel: Record<string, number>
  recentCount: number
}> {
  const supabase = createServiceRoleClient()

  const { data: allData } = await supabase
    .from('ai_training_data')
    .select('use_case, user_feedback, created_at')

  const rows = (allData ?? []) as Array<{
    use_case: string | null
    user_feedback: string | null
    created_at: string
  }>

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const bySource: Record<string, number> = {}
  const byLabel: Record<string, number> = {}
  let recentCount = 0

  for (const row of rows) {
    const source = row.use_case || 'unknown'
    bySource[source] = (bySource[source] || 0) + 1

    const label = row.user_feedback || 'unlabeled'
    byLabel[label] = (byLabel[label] || 0) + 1

    if (row.created_at >= thirtyDaysAgo) recentCount++
  }

  return { total: rows.length, bySource, byLabel, recentCount }
}
