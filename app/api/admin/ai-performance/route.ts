import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient() as any

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }

    // Fetch AI model usage with service role (bypasses RLS)
    const { data: usageData, error: usageError } = await supabase
      .from('ai_model_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (usageError) {
      console.error('[AI Performance API] ai_model_usage error:', usageError.message)
    }

    // Fetch training data
    const { data: trainingData, error: trainingError } = await supabase
      .from('ai_training_data')
      .select('id, use_case, accuracy_score, user_feedback, validated, created_at')
      .gte('created_at', startDate.toISOString())

    if (trainingError) {
      console.error('[AI Performance API] ai_training_data error:', trainingError.message)
    }

    console.log(`[AI Performance API] Results: usage=${(usageData || []).length} rows, training=${(trainingData || []).length} rows`)

    return NextResponse.json({
      success: true,
      usageData: usageData || [],
      trainingData: trainingData || [],
      debug: {
        usageError: usageError?.message || null,
        trainingError: trainingError?.message || null,
        usageCount: (usageData || []).length,
        trainingCount: (trainingData || []).length,
      },
    })
  } catch (error) {
    console.error('[AI Performance API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
