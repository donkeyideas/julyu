import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Whitelisted keys that can be read publicly
const PUBLIC_KEYS = ['user_sign_in_enabled']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key || !PUBLIC_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Public Settings] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 })
    }

    // Default to true if setting doesn't exist
    const value = (data as any)?.value
    const enabled = value?.enabled ?? true

    return NextResponse.json({ enabled })
  } catch (error: any) {
    console.error('[Public Settings] Error:', error)
    return NextResponse.json({ enabled: true }, { status: 200 })
  }
}
