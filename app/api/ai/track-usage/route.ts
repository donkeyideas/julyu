import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      model_name,
      provider,
      use_case,
      input_tokens,
      output_tokens,
      response_time_ms,
      cost,
      success,
      error_message,
      user_id: providedUserId,
    } = body

    const supabase = await createServerClient()

    // Get user_id from auth or use provided
    let userId = providedUserId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    // In test mode, use test user id
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    if (!userId && isTestMode) {
      userId = 'test-user-id'
    }

    // Store usage record
    const { error } = await supabase
      .from('ai_model_usage')
      .insert({
        model_name,
        provider,
        use_case,
        input_tokens: input_tokens || 0,
        output_tokens: output_tokens || 0,
        total_tokens: (input_tokens || 0) + (output_tokens || 0),
        response_time_ms: response_time_ms || 0,
        cost: cost || 0,
        success: success !== false,
        error_message,
        user_id: userId,
      })

    if (error) {
      // If table doesn't exist, that's okay - return success anyway
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('[Track Usage] Table not found, but tracking accepted')
        return NextResponse.json({ success: true, message: 'Tracking accepted (table not available)' })
      }
      console.error('[Track Usage] Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Usage tracked successfully' })
  } catch (error: any) {
    console.error('[Track Usage] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}


