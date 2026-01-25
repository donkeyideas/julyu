import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    const supabase = createServerClient()

    if (key) {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', key)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Settings API] Error fetching:', error)
        return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 })
      }

      return NextResponse.json({ setting: data })
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')

    if (error) {
      console.error('[Settings API] Error fetching all:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings: data || [] })
  } catch (error: any) {
    console.error('[Settings API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, description } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Upsert the setting
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value: typeof value === 'string' ? JSON.parse(value) : value,
        description: description || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })

    if (error) {
      console.error('[Settings API] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Settings API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('site_settings')
      .delete()
      .eq('key', key)

    if (error) {
      console.error('[Settings API] Error deleting:', error)
      return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Settings API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
