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
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Step 1: Match products using DeepSeek
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      )
    }

    const matches = await deepseekClient.matchProducts(items, {})

    // Step 2: Get prices from Instacart API
    if (!process.env.INSTACART_API_KEY) {
      return NextResponse.json(
        { error: 'Instacart API key not configured' },
        { status: 500 }
      )
    }

    // TODO: Implement Instacart API integration
    // For now, return error if API keys are not configured
    return NextResponse.json(
      { error: 'Instacart API integration not yet implemented. Please configure API keys and implement integration.' },
      { status: 501 }
    )

    // This code will be reached once Instacart API is implemented
    // For now, the function returns early with 501 error above
  } catch (error: any) {
    console.error('Comparison error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze list' },
      { status: 500 }
    )
  }
}
