/**
 * Model Evaluation Framework
 * Benchmarks model quality across different task types.
 * Uses stored training data with known-good labels as test sets.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

// ============================================
// Types
// ============================================

export interface EvaluationConfig {
  taskType: string
  sampleSize: number
  model?: string // Override default model routing
}

export interface EvaluationResult {
  taskType: string
  model: string
  sampleSize: number
  metrics: {
    accuracy: number // % of correct predictions
    precision: number // true positives / (true positives + false positives)
    recall: number // true positives / (true positives + false negatives)
    f1Score: number
    avgConfidence: number
    avgResponseTimeMs: number
  }
  errors: string[]
  evaluatedAt: string
}

export interface EvaluationSuiteResult {
  results: EvaluationResult[]
  overallAccuracy: number
  evaluatedAt: string
}

interface TestSample {
  input: string
  expectedOutput: string
  source: string
}

// ============================================
// Evaluation Functions
// ============================================

/**
 * Evaluate product matching accuracy.
 * Uses user-corrected matches as ground truth.
 */
async function evaluateProductMatching(
  sampleSize: number
): Promise<EvaluationResult> {
  const supabase = createServiceRoleClient()
  const startTime = Date.now()

  // Get validated training samples
  const { data } = await supabase
    .from('ai_training_data')
    .select('input_text, output_text, accuracy_score')
    .eq('use_case', 'product_matching')
    .eq('user_feedback', 'positive')
    .order('created_at', { ascending: false })
    .limit(sampleSize)

  const samples = (data ?? []) as Array<{
    input_text: string | null
    output_text: string | null
    accuracy_score: number | null
  }>

  if (samples.length === 0) {
    return emptyResult('product_matching', 'deepseek-chat')
  }

  let correct = 0
  let total = 0
  let totalResponseTime = 0
  let totalConfidence = 0
  const errors: string[] = []

  for (const sample of samples) {
    if (!sample.input_text || !sample.output_text) continue
    total++

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: 'You are a product matching assistant. Given a raw product name from a receipt or shopping list, identify the most likely matching product. Return ONLY the product name and brand in parentheses.',
        },
        { role: 'user', content: sample.input_text },
      ]

      const t0 = Date.now()
      const response = await llmOrchestrator.chat(messages, {
        taskType: 'product_matching',
        maxTokens: 100,
        temperature: 0,
      })
      totalResponseTime += Date.now() - t0

      // Fuzzy match: check if the expected output appears in the response
      const responseNorm = response.content.toLowerCase().trim()
      const expectedNorm = sample.output_text.toLowerCase().trim()

      // Consider it correct if the response contains the expected product name
      const expectedWords = expectedNorm.split(/\s+/).filter(w => w.length > 2)
      const matchedWords = expectedWords.filter(w => responseNorm.includes(w))
      const wordMatchRatio = expectedWords.length > 0 ? matchedWords.length / expectedWords.length : 0

      if (wordMatchRatio >= 0.6) {
        correct++
        totalConfidence += wordMatchRatio
      } else {
        totalConfidence += wordMatchRatio
      }
    } catch (error) {
      errors.push(`Sample "${sample.input_text}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const accuracy = total > 0 ? correct / total : 0
  const avgConfidence = total > 0 ? totalConfidence / total : 0
  const avgResponseTime = total > 0 ? totalResponseTime / total : 0

  return {
    taskType: 'product_matching',
    model: 'deepseek-chat',
    sampleSize: total,
    metrics: {
      accuracy,
      precision: accuracy, // Simplified for product matching
      recall: accuracy,
      f1Score: accuracy, // precision === recall in this simplified case
      avgConfidence,
      avgResponseTimeMs: avgResponseTime,
    },
    errors,
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Evaluate chat response quality using rated conversations.
 */
async function evaluateChatQuality(sampleSize: number): Promise<EvaluationResult> {
  const supabase = createServiceRoleClient()

  // Get conversations with feedback
  const { data } = await supabase
    .from('ai_training_data')
    .select('input_text, output_text, accuracy_score, user_feedback')
    .eq('use_case', 'chat_quality')
    .order('created_at', { ascending: false })
    .limit(sampleSize)

  const samples = (data ?? []) as Array<{
    input_text: string | null
    output_text: string | null
    accuracy_score: number | null
    user_feedback: string | null
  }>

  if (samples.length === 0) {
    return emptyResult('chat_quality', 'deepseek-chat')
  }

  let positiveCount = 0
  let totalScore = 0
  const total = samples.length

  for (const sample of samples) {
    if (sample.user_feedback === 'positive') positiveCount++
    totalScore += sample.accuracy_score ?? 0.5
  }

  const accuracy = total > 0 ? positiveCount / total : 0
  const avgConfidence = total > 0 ? totalScore / total : 0

  return {
    taskType: 'chat_quality',
    model: 'deepseek-chat',
    sampleSize: total,
    metrics: {
      accuracy,
      precision: accuracy,
      recall: accuracy,
      f1Score: accuracy,
      avgConfidence,
      avgResponseTimeMs: 0, // Not re-running the model for chat eval
    },
    errors: [],
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Evaluate alert effectiveness using user actions.
 */
async function evaluateAlertEffectiveness(sampleSize: number): Promise<EvaluationResult> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('ai_training_data')
    .select('input_text, output_text, user_feedback')
    .eq('use_case', 'alert_effectiveness')
    .order('created_at', { ascending: false })
    .limit(sampleSize)

  const samples = (data ?? []) as Array<{
    input_text: string | null
    output_text: string | null
    user_feedback: string | null
  }>

  if (samples.length === 0) {
    return emptyResult('alert_effectiveness', 'n/a')
  }

  let actedOn = 0
  const total = samples.length

  for (const sample of samples) {
    if (sample.output_text === 'acted_on') actedOn++
  }

  const effectiveness = total > 0 ? actedOn / total : 0

  return {
    taskType: 'alert_effectiveness',
    model: 'n/a',
    sampleSize: total,
    metrics: {
      accuracy: effectiveness,
      precision: effectiveness,
      recall: effectiveness,
      f1Score: effectiveness,
      avgConfidence: effectiveness,
      avgResponseTimeMs: 0,
    },
    errors: [],
    evaluatedAt: new Date().toISOString(),
  }
}

// ============================================
// Helpers
// ============================================

function emptyResult(taskType: string, model: string): EvaluationResult {
  return {
    taskType,
    model,
    sampleSize: 0,
    metrics: {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      avgConfidence: 0,
      avgResponseTimeMs: 0,
    },
    errors: ['No evaluation data available'],
    evaluatedAt: new Date().toISOString(),
  }
}

// ============================================
// Public API
// ============================================

/**
 * Run a full evaluation suite across all task types.
 */
export async function runEvaluationSuite(
  sampleSize: number = 50
): Promise<EvaluationSuiteResult> {
  const results: EvaluationResult[] = []

  // Run evaluations sequentially to avoid overwhelming the API
  const evaluators = [
    () => evaluateProductMatching(sampleSize),
    () => evaluateChatQuality(sampleSize),
    () => evaluateAlertEffectiveness(sampleSize),
  ]

  for (const evaluator of evaluators) {
    try {
      const result = await evaluator()
      results.push(result)
    } catch (error) {
      console.error('[Evaluation] Error:', error)
    }
  }

  // Calculate overall accuracy (weighted by sample size)
  const totalSamples = results.reduce((sum, r) => sum + r.sampleSize, 0)
  const weightedAccuracy = totalSamples > 0
    ? results.reduce((sum, r) => sum + r.metrics.accuracy * r.sampleSize, 0) / totalSamples
    : 0

  return {
    results,
    overallAccuracy: weightedAccuracy,
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Run evaluation for a specific task type.
 */
export async function evaluateTask(config: EvaluationConfig): Promise<EvaluationResult> {
  switch (config.taskType) {
    case 'product_matching':
      return evaluateProductMatching(config.sampleSize)
    case 'chat_quality':
      return evaluateChatQuality(config.sampleSize)
    case 'alert_effectiveness':
      return evaluateAlertEffectiveness(config.sampleSize)
    default:
      return emptyResult(config.taskType, 'unknown')
  }
}

/**
 * Get historical evaluation results from the model registry.
 */
export async function getEvaluationHistory(): Promise<Array<{
  id: string
  name: string
  version: string
  status: string
  performance_metrics: Record<string, unknown> | null
  created_at: string
}>> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('model_registry')
    .select('id, name, version, status, performance_metrics, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []) as Array<{
    id: string
    name: string
    version: string
    status: string
    performance_metrics: Record<string, unknown> | null
    created_at: string
  }>
}
