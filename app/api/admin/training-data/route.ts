import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

type TrainingDataStat = {
  use_case: string | null
  validated: boolean | null
  user_feedback: string | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const useCase = searchParams.get('use_case')
    const validated = searchParams.get('validated')
    const feedback = searchParams.get('feedback')

    // Build query with explicit column selection to avoid schema mismatches
    let query = supabase
      .from('ai_training_data')
      .select('id, use_case, input_text, actual_output, user_feedback, validated, validation_notes, model_name, accuracy_score, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (useCase) {
      query = query.eq('use_case', useCase)
    }
    if (validated !== null && validated !== '') {
      query = query.eq('validated', validated === 'true')
    }
    if (feedback) {
      query = query.eq('user_feedback', feedback)
    }

    const { data: trainingData, error, count } = await query

    if (error) {
      console.error('Training data query error:', error)
      throw error
    }

    // Get summary stats
    const { data: stats, error: statsError } = await supabase
      .from('ai_training_data')
      .select('use_case, validated, user_feedback')

    if (statsError) {
      console.error('Training data stats error:', statsError)
    }

    const statList: TrainingDataStat[] = stats ?? []
    const summary = {
      total: statList.length,
      validated: statList.filter(s => s.validated).length,
      pending: statList.filter(s => !s.validated).length,
      byUseCase: {} as Record<string, number>,
      byFeedback: {
        positive: statList.filter(s => s.user_feedback === 'positive').length,
        negative: statList.filter(s => s.user_feedback === 'negative').length,
        neutral: statList.filter(s => s.user_feedback === 'neutral').length,
      }
    }

    statList.forEach(s => {
      if (s.use_case) {
        summary.byUseCase[s.use_case] = (summary.byUseCase[s.use_case] || 0) + 1
      }
    })

    return NextResponse.json({
      data: trainingData || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary
    })
  } catch (error) {
    console.error('Error fetching training data:', error)
    return NextResponse.json({ error: 'Failed to fetch training data' }, { status: 500 })
  }
}

// Update training data record (validate, add notes, feedback)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, validated, validation_notes, user_feedback, accuracy_score } = body

    const updateData: Record<string, unknown> = {}
    if (validated !== undefined) updateData.validated = validated
    if (validation_notes !== undefined) updateData.validation_notes = validation_notes
    if (user_feedback !== undefined) updateData.user_feedback = user_feedback
    if (accuracy_score !== undefined) updateData.accuracy_score = accuracy_score

    const { data, error } = await supabase
      .from('ai_training_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating training data:', error)
    return NextResponse.json({ error: 'Failed to update training data' }, { status: 500 })
  }
}

// Delete training data record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ai_training_data')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting training data:', error)
    return NextResponse.json({ error: 'Failed to delete training data' }, { status: 500 })
  }
}
