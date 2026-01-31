import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { rule, ids } = body

    let count = 0

    if (rule === 'positive_feedback') {
      // Auto-validate all records with positive user feedback
      const { data, error } = await supabase
        .from('ai_training_data')
        .update({ validated: true })
        .eq('user_feedback', 'positive')
        .eq('validated', false)
        .select('id')

      if (error) throw error
      count = data?.length || 0
    } else if (rule === 'negative_feedback_delete') {
      // Delete all records with negative feedback (optional cleanup)
      const { data, error } = await supabase
        .from('ai_training_data')
        .delete()
        .eq('user_feedback', 'negative')
        .select('id')

      if (error) throw error
      count = data?.length || 0
    } else if (ids && Array.isArray(ids)) {
      // Validate specific IDs
      const { data, error } = await supabase
        .from('ai_training_data')
        .update({ validated: true })
        .in('id', ids)
        .select('id')

      if (error) throw error
      count = data?.length || 0
    } else {
      return NextResponse.json({ error: 'Invalid rule or ids' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count, rule })
  } catch (error) {
    console.error('Bulk validation error:', error)
    return NextResponse.json({ error: 'Failed to bulk validate' }, { status: 500 })
  }
}
