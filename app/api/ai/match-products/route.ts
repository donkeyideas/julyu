import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId && !isTestMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, context } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Get user preferences for context
    let dietary: string[] = []
    if (userId) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('dietary_restrictions')
        .eq('user_id', userId)
        .single()
      dietary = (preferences?.dietary_restrictions as string[]) || []
    }

    // Match products via orchestrator (handles routing, caching, cost tracking)
    const startTime = Date.now()
    const response = await llmOrchestrator.matchProducts(
      items.map((item: string) => item),
      { dietary, brands: context?.brands }
    )

    // Parse JSON response
    let matches
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/)?.[0]
      matches = jsonMatch ? JSON.parse(jsonMatch) : JSON.parse(response.content)
      if (!Array.isArray(matches)) matches = [matches]
    } catch {
      console.error('Failed to parse product matching response:', response.content)
      throw new Error('Failed to parse product matches')
    }

    return NextResponse.json({
      matches,
      processingTime: Date.now() - startTime,
      totalMatches: matches.length,
      model: response.model,
      cached: response.cached || false,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Product matching error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to match products' },
      { status: 500 }
    )
  }
}


