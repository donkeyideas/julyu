import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type TrainingDataRecord = {
  id: string | number
  input_text: string | null
  output_text: string | null
  use_case: string | null
  model_name: string | null
  accuracy_score: number | null
  user_feedback: string | null
  created_at: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { use_case, validated_only, format = 'jsonl' } = body

    // Build query for export
    let query = supabase
      .from('ai_training_data')
      .select('*')
      .order('created_at', { ascending: false })

    if (use_case) {
      query = query.eq('use_case', use_case)
    }
    if (validated_only) {
      query = query.eq('validated', true)
    }

    const { data: trainingData, error } = await query

    if (error) throw error

    if (!trainingData || trainingData.length === 0) {
      return NextResponse.json({ error: 'No training data found' }, { status: 404 })
    }

    // Format data for export
    let exportContent: string
    let contentType: string
    let fileExtension: string

    if (format === 'jsonl') {
      // JSONL format (one JSON object per line) - ideal for fine-tuning
      exportContent = trainingData
        .map((record: TrainingDataRecord) => {
          const formatted = {
            input: record.input_text,
            output: record.output_text,
            metadata: {
              id: record.id,
              use_case: record.use_case,
              model_name: record.model_name,
              accuracy_score: record.accuracy_score,
              user_feedback: record.user_feedback,
              created_at: record.created_at
            }
          }
          return JSON.stringify(formatted)
        })
        .join('\n')
      contentType = 'application/jsonl'
      fileExtension = 'jsonl'
    } else if (format === 'csv') {
      // CSV format
      const headers = ['id', 'input', 'output', 'use_case', 'model_name', 'accuracy_score', 'user_feedback', 'created_at']
      const rows = trainingData.map(record => {
        return [
          record.id,
          `"${(record.input_text || '').replace(/"/g, '""')}"`,
          `"${(record.output_text || '').replace(/"/g, '""')}"`,
          record.use_case || '',
          record.model_name || '',
          record.accuracy_score || '',
          record.user_feedback || '',
          record.created_at
        ].join(',')
      })
      exportContent = [headers.join(','), ...rows].join('\n')
      contentType = 'text/csv'
      fileExtension = 'csv'
    } else {
      // Plain JSON
      exportContent = JSON.stringify(trainingData, null, 2)
      contentType = 'application/json'
      fileExtension = 'json'
    }

    // Record the export
    const { data: exportRecord } = await supabase
      .from('training_data_exports')
      .insert({
        record_count: trainingData.length,
        format,
        use_case,
        filters: { validated_only }
      })
      .select()
      .single()

    // Return the file
    const filename = `training-data-${use_case || 'all'}-${new Date().toISOString().split('T')[0]}.${fileExtension}`

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Id': exportRecord?.id || '',
        'X-Record-Count': trainingData.length.toString()
      }
    })
  } catch (error) {
    console.error('Error exporting training data:', error)
    return NextResponse.json({ error: 'Failed to export training data' }, { status: 500 })
  }
}

// Get export history
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: exports, error } = await supabase
      .from('training_data_exports')
      .select('*')
      .order('export_date', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ exports: exports || [] })
  } catch (error) {
    console.error('Error fetching export history:', error)
    return NextResponse.json({ error: 'Failed to fetch export history' }, { status: 500 })
  }
}
