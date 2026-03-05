import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'social_media_automation'

// GET - Read automation config
export async function GET() {
  try {
    const supabase = await createServiceRoleClient() as any
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Social Posts] Automation config read error:', error)
      return NextResponse.json({ error: 'Failed to read automation config' }, { status: 500 })
    }

    const defaultConfig = {
      enabled: false,
      platforms: [],
      hour: 9,
      topics: [],
      use_domain_content: false,
      require_approval: true,
    }

    return NextResponse.json({
      success: true,
      config: data?.value || defaultConfig,
    })
  } catch (error: any) {
    console.error('[Social Posts] Automation GET Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST - Save automation config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, platforms, hour, topics, use_domain_content, require_approval } = body

    const config = {
      enabled: !!enabled,
      platforms: Array.isArray(platforms) ? platforms : [],
      hour: typeof hour === 'number' ? Math.min(23, Math.max(0, hour)) : 9,
      topics: Array.isArray(topics) ? topics.filter((t: string) => t.trim()) : [],
      use_domain_content: !!use_domain_content,
      require_approval: require_approval !== false,
    }

    const supabase = await createServiceRoleClient() as any
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: SETTINGS_KEY,
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('[Social Posts] Automation config save error:', error)
      return NextResponse.json({ error: 'Failed to save automation config' }, { status: 500 })
    }

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('[Social Posts] Automation POST Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
