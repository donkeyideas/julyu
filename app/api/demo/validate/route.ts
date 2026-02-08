import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Demo code is required' },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toUpperCase()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Demo Validate] Supabase not configured')
      return NextResponse.json(
        { valid: false, error: 'Service unavailable' },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the code
    const { data: demoCode, error: lookupError } = await supabase
      .from('demo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (lookupError || !demoCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid demo code. Please check and try again.' },
        { status: 404 }
      )
    }

    // Check if active
    if (!demoCode.is_active) {
      return NextResponse.json(
        { valid: false, error: 'This demo code has been deactivated.' },
        { status: 403 }
      )
    }

    // Check expiration
    if (new Date(demoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This demo code has expired.' },
        { status: 403 }
      )
    }

    // Check usage limit
    if (demoCode.uses_count >= demoCode.max_uses) {
      return NextResponse.json(
        { valid: false, error: 'This demo code has reached its usage limit.' },
        { status: 403 }
      )
    }

    // Update usage count
    await supabase
      .from('demo_codes')
      .update({
        uses_count: demoCode.uses_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', demoCode.id)

    return NextResponse.json({
      valid: true,
      demoType: demoCode.demo_type,
      expiresAt: demoCode.expires_at,
      name: demoCode.name || 'Demo User',
    })
  } catch (error) {
    console.error('[Demo Validate] Error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
