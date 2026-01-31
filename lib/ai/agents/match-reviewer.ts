/**
 * Product Matching Quality Reviewer
 * Reviews AI-generated product matches from receipt OCR and shopping lists.
 * Flags low-confidence matches for human review.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface MatchReviewItem {
  id: string
  sourceTable: 'list_items' | 'receipt_items'
  sourceId: string
  userInput: string
  matchedProductId: string | null
  matchedProductName: string | null
  matchedProductBrand: string | null
  confidence: number | null
  status: 'pending_review' | 'approved' | 'rejected' | 'corrected'
  suggestedAlternatives: Array<{
    productId: string
    name: string
    brand: string | null
    similarity: number
  }>
  createdAt: string
}

export interface MatchReviewStats {
  totalPending: number
  totalReviewed: number
  approvalRate: number
  correctionRate: number
  avgConfidence: number
}

/**
 * Get items that need match quality review.
 */
export async function getPendingReviews(
  limit: number = 20,
  minConfidence: number = 0,
  maxConfidence: number = 0.8
): Promise<MatchReviewItem[]> {
  const supabase = createServiceRoleClient() as any
  const items: MatchReviewItem[] = []

  // Get low-confidence list item matches
  const { data: listItems } = await supabase
    .from('list_items')
    .select('id, user_input, matched_product_id, match_confidence, created_at')
    .not('matched_product_id', 'is', null)
    .gte('match_confidence', minConfidence)
    .lte('match_confidence', maxConfidence)
    .order('match_confidence', { ascending: true })
    .limit(limit)

  const listRows = (listItems ?? []) as Array<{
    id: string
    user_input: string
    matched_product_id: string | null
    match_confidence: number | null
    created_at: string
  }>

  for (const item of listRows) {
    if (!item.matched_product_id) continue

    // Get matched product details
    const { data: product } = await supabase
      .from('products')
      .select('id, name, brand')
      .eq('id', item.matched_product_id)
      .single()

    const productRow = product as { id: string; name: string; brand: string | null } | null

    // Find alternative matches
    const alternatives = await findAlternativeMatches(item.user_input, item.matched_product_id)

    items.push({
      id: `li-${item.id}`,
      sourceTable: 'list_items',
      sourceId: item.id,
      userInput: item.user_input,
      matchedProductId: item.matched_product_id,
      matchedProductName: productRow?.name ?? null,
      matchedProductBrand: productRow?.brand ?? null,
      confidence: item.match_confidence,
      status: 'pending_review',
      suggestedAlternatives: alternatives,
      createdAt: item.created_at,
    })
  }

  // Get low-confidence receipt item matches
  const { data: receiptItems } = await supabase
    .from('receipt_items')
    .select('id, product_name_raw, matched_product_id, match_confidence, created_at')
    .not('matched_product_id', 'is', null)
    .gte('match_confidence', minConfidence)
    .lte('match_confidence', maxConfidence)
    .order('match_confidence', { ascending: true })
    .limit(limit)

  const receiptRows = (receiptItems ?? []) as Array<{
    id: string
    product_name_raw: string
    matched_product_id: string | null
    match_confidence: number | null
    created_at: string
  }>

  for (const item of receiptRows) {
    if (!item.matched_product_id) continue

    const { data: product } = await supabase
      .from('products')
      .select('id, name, brand')
      .eq('id', item.matched_product_id)
      .single()

    const productRow = product as { id: string; name: string; brand: string | null } | null
    const alternatives = await findAlternativeMatches(item.product_name_raw, item.matched_product_id)

    items.push({
      id: `ri-${item.id}`,
      sourceTable: 'receipt_items',
      sourceId: item.id,
      userInput: item.product_name_raw,
      matchedProductId: item.matched_product_id,
      matchedProductName: productRow?.name ?? null,
      matchedProductBrand: productRow?.brand ?? null,
      confidence: item.match_confidence,
      status: 'pending_review',
      suggestedAlternatives: alternatives,
      createdAt: item.created_at,
    })
  }

  // Sort by confidence (lowest first)
  items.sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0))

  return items.slice(0, limit)
}

/**
 * Approve or correct a product match.
 */
export async function reviewMatch(
  sourceTable: 'list_items' | 'receipt_items',
  sourceId: string,
  action: 'approve' | 'reject' | 'correct',
  correctedProductId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient() as any

  if (action === 'approve') {
    // Boost confidence to indicate human approval
    if (sourceTable === 'list_items') {
      await supabase.from('list_items').update({ match_confidence: 1.0 }).eq('id', sourceId)
    } else {
      await supabase.from('receipt_items').update({ match_confidence: 1.0, user_corrected: false }).eq('id', sourceId)
    }
  } else if (action === 'reject') {
    // Remove the match
    if (sourceTable === 'list_items') {
      await supabase.from('list_items').update({ matched_product_id: null, match_confidence: null }).eq('id', sourceId)
    } else {
      await supabase.from('receipt_items').update({ matched_product_id: null, match_confidence: null }).eq('id', sourceId)
    }
  } else if (action === 'correct' && correctedProductId) {
    // Update to correct product
    if (sourceTable === 'list_items') {
      await supabase.from('list_items').update({
        matched_product_id: correctedProductId,
        match_confidence: 1.0,
      }).eq('id', sourceId)
    } else {
      await supabase.from('receipt_items').update({
        matched_product_id: correctedProductId,
        match_confidence: 1.0,
        user_corrected: true,
      }).eq('id', sourceId)
    }

    // Store as training data for future model improvement
    const { data: original } = sourceTable === 'list_items'
      ? await supabase.from('list_items').select('user_input').eq('id', sourceId).single()
      : await supabase.from('receipt_items').select('product_name_raw').eq('id', sourceId).single()

    if (original) {
      const inputText = (original as { user_input?: string; product_name_raw?: string }).user_input
        || (original as { product_name_raw?: string }).product_name_raw || ''

      await supabase.from('ai_training_data').insert({
        input_text: inputText,
        output_text: correctedProductId,
        metadata: { type: 'product_match_correction', sourceTable, sourceId },
      })
    }
  }

  return { success: true }
}

/**
 * Get match review statistics.
 */
export async function getMatchReviewStats(): Promise<MatchReviewStats> {
  const supabase = createServiceRoleClient() as any

  // Count low confidence matches in list_items
  const { data: lowConfList } = await supabase
    .from('list_items')
    .select('match_confidence')
    .not('matched_product_id', 'is', null)
    .lt('match_confidence', 0.8)

  // Count high confidence (reviewed/approved)
  const { data: highConfList } = await supabase
    .from('list_items')
    .select('match_confidence')
    .not('matched_product_id', 'is', null)
    .gte('match_confidence', 0.8)

  // Count user corrections in receipt_items
  const { data: corrections } = await supabase
    .from('receipt_items')
    .select('id')
    .eq('user_corrected', true)

  const pending = (lowConfList ?? []).length
  const reviewed = (highConfList ?? []).length
  const corrected = (corrections ?? []).length
  const total = pending + reviewed

  const allConfidences = [...(lowConfList ?? []), ...(highConfList ?? [])]
    .map((r: { match_confidence: number | null }) => r.match_confidence ?? 0)

  const avgConfidence = allConfidences.length > 0
    ? allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length
    : 0

  return {
    totalPending: pending,
    totalReviewed: reviewed,
    approvalRate: total > 0 ? reviewed / total : 0,
    correctionRate: total > 0 ? corrected / total : 0,
    avgConfidence,
  }
}

/**
 * Find alternative product matches for a given input.
 */
async function findAlternativeMatches(
  userInput: string,
  excludeProductId: string
): Promise<Array<{ productId: string; name: string; brand: string | null; similarity: number }>> {
  const supabase = createServiceRoleClient() as any

  // Simple text search for alternatives
  const words = userInput.split(/\s+/).filter(w => w.length > 2).slice(0, 3)
  if (words.length === 0) return []

  const searchTerm = words[0]
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand')
    .neq('id', excludeProductId)
    .ilike('name', `%${searchTerm}%`)
    .limit(5)

  return ((products ?? []) as Array<{ id: string; name: string; brand: string | null }>).map(p => ({
    productId: p.id,
    name: p.name,
    brand: p.brand,
    similarity: calculateSimilarity(userInput.toLowerCase(), p.name.toLowerCase()),
  })).sort((a, b) => b.similarity - a.similarity)
}

/**
 * Simple similarity score (Jaccard index of word sets).
 */
function calculateSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/))
  const setB = new Set(b.split(/\s+/))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size > 0 ? intersection.size / union.size : 0
}
