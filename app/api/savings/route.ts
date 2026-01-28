import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null

    try {
      const supabase = createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch {
      // Supabase auth failed, try Firebase
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createServiceRoleClient()

    // Get last 6 months of savings data
    const { data: savings, error } = await adminSupabase
      .from('user_savings')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(6)

    if (error) {
      console.error('[Savings] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch savings data' }, { status: 500 })
    }

    return NextResponse.json({ savings: savings || [] })
  } catch (error) {
    console.error('[Savings] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch savings data' }, { status: 500 })
  }
}
