import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Handle GET request (direct link click)
export async function GET() {
  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/auth/login', appUrl))
  } catch (error) {
    console.error('[Signout] Error:', error)
    // Still redirect to login even if signout fails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/auth/login', appUrl))
  }
}

// Handle POST request (programmatic signout)
export async function POST() {
  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Signout] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 })
  }
}
