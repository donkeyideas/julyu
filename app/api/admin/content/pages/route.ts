import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export interface PageContent {
  slug: string
  title: string
  headline: string
  subheadline: string
  meta_description: string
  content: Record<string, any>
  updated_at: string
}

// GET - Fetch page content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    const supabase = createServerClient()

    if (slug) {
      // Fetch specific page
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', `page_content_${slug}`)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Pages API] Error fetching:', error)
        return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ page: null })
      }

      return NextResponse.json({ page: data.value })
    }

    // Fetch all page content
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .like('key', 'page_content_%')

    if (error) {
      console.error('[Pages API] Error fetching all:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    const pages = (data || []).map(item => ({
      slug: item.key.replace('page_content_', ''),
      ...item.value
    }))

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('[Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update page content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, data: pageData } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const content: PageContent = {
      slug,
      title: pageData.title || '',
      headline: pageData.headline || '',
      subheadline: pageData.subheadline || '',
      meta_description: pageData.meta_description || '',
      content: pageData.content || {},
      updated_at: new Date().toISOString(),
    }

    // Upsert the page content
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: `page_content_${slug}`,
        value: content,
        description: `Page content for /${slug}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })

    if (error) {
      console.error('[Pages API] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: content })
  } catch (error: any) {
    console.error('[Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
