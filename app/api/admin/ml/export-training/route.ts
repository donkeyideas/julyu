/**
 * POST /api/admin/ml/export-training — Export training data in fine-tuning formats
 * Supports: OpenAI JSONL, HuggingFace JSON, CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

type ExportFormat = 'openai' | 'huggingface' | 'csv' | 'jsonl'

interface TrainingRow {
  id: string
  input_text: string | null
  output_text: string | null
  use_case: string | null
  model_name: string | null
  accuracy_score: number | null
  user_feedback: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const {
      format = 'openai',
      use_case,
      feedback_filter,
      min_accuracy,
      limit = 10000,
    } = body as {
      format?: ExportFormat
      use_case?: string
      feedback_filter?: 'positive' | 'negative' | 'neutral'
      min_accuracy?: number
      limit?: number
    }

    // Build query
    let query = supabase
      .from('ai_training_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (use_case) {
      query = query.eq('use_case', use_case)
    }
    if (feedback_filter) {
      query = query.eq('user_feedback', feedback_filter)
    }
    if (min_accuracy !== undefined) {
      query = query.gte('accuracy_score', min_accuracy)
    }

    const { data, error } = await query

    if (error) throw error

    const rows = (data ?? []) as TrainingRow[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No training data found matching filters' }, { status: 404 })
    }

    // Filter out rows without both input and output
    const validRows = rows.filter(r => r.input_text && r.output_text)

    let exportContent: string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'openai': {
        // OpenAI fine-tuning format: {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
        const systemPrompts: Record<string, string> = {
          product_matching: 'You are a product matching assistant. Match raw product names from receipts to their correct product names.',
          chat_quality: 'You are a helpful grocery shopping assistant for the Julyu app.',
          substitution: 'You are a product substitution recommender. Suggest alternatives when a product is unavailable.',
          alert_effectiveness: 'You are a price alert analyst.',
        }

        exportContent = validRows
          .map(row => {
            const systemContent = systemPrompts[row.use_case || ''] || 'You are a helpful assistant.'
            return JSON.stringify({
              messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: row.input_text },
                { role: 'assistant', content: row.output_text },
              ],
            })
          })
          .join('\n')
        contentType = 'application/jsonl'
        fileExtension = 'jsonl'
        break
      }

      case 'huggingface': {
        // HuggingFace dataset format: array of {instruction, input, output}
        const hfData = validRows.map(row => ({
          instruction: getInstruction(row.use_case),
          input: row.input_text,
          output: row.output_text,
          metadata: {
            source: row.use_case,
            accuracy: row.accuracy_score,
            feedback: row.user_feedback,
          },
        }))
        exportContent = JSON.stringify(hfData, null, 2)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      }

      case 'csv': {
        const headers = ['input', 'output', 'use_case', 'accuracy_score', 'user_feedback', 'created_at']
        const csvRows = validRows.map(row =>
          [
            escapeCsv(row.input_text || ''),
            escapeCsv(row.output_text || ''),
            row.use_case || '',
            row.accuracy_score?.toString() || '',
            row.user_feedback || '',
            row.created_at,
          ].join(',')
        )
        exportContent = [headers.join(','), ...csvRows].join('\n')
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      }

      case 'jsonl':
      default: {
        // Generic JSONL
        exportContent = validRows
          .map(row =>
            JSON.stringify({
              input: row.input_text,
              output: row.output_text,
              use_case: row.use_case,
              accuracy: row.accuracy_score,
              feedback: row.user_feedback,
            })
          )
          .join('\n')
        contentType = 'application/jsonl'
        fileExtension = 'jsonl'
        break
      }
    }

    // Record the export
    await supabase.from('training_data_exports').insert({
      record_count: validRows.length,
      format,
      use_case: use_case || 'all',
      filters: { feedback_filter, min_accuracy, limit },
    })

    const filename = `training-${format}-${use_case || 'all'}-${new Date().toISOString().split('T')[0]}.${fileExtension}`

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Record-Count': validRows.length.toString(),
      },
    })
  } catch (error) {
    console.error('[ML/Export] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export training data' },
      { status: 500 }
    )
  }
}

function getInstruction(useCase: string | null): string {
  switch (useCase) {
    case 'product_matching':
      return 'Match the following raw product name from a receipt to the correct product name and brand.'
    case 'chat_quality':
      return 'Respond to the following grocery shopping question helpfully and concisely.'
    case 'substitution':
      return 'Suggest a suitable substitute for the following product.'
    case 'alert_effectiveness':
      return 'Predict whether the user will act on this price alert.'
    default:
      return 'Complete the following task.'
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
