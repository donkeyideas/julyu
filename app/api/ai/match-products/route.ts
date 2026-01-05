import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekClient } from '@/lib/api/deepseek'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    if (!user && !isTestMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, context } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Get user preferences for context
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const matchContext = {
      ...context,
      dietary: preferences?.dietary_restrictions || [],
      userId: user.id,
    }

    // Match products using DeepSeek
    const matches = await deepseekClient.matchProducts(
      items.map((item: string) => item),
      matchContext
    )

    return NextResponse.json({
      matches,
      processingTime: Date.now(),
      totalMatches: matches.length,
    })
  } catch (error: any) {
    console.error('Product matching error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to match products' },
      { status: 500 }
    )
  }
}


