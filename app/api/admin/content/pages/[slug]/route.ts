import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PageContent {
  slug: string
  title: string
  headline: string
  subheadline: string
  meta_description: string
  content: Record<string, any>
  updated_at: string
}

// GET - Fetch specific page content
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const supabase = createServiceRoleClient()

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
  } catch (error: any) {
    console.error('[Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update specific page content
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const body = await request.json()

    const supabase = createServiceRoleClient()

    const content: PageContent = {
      slug,
      title: body.title || '',
      headline: body.headline || '',
      subheadline: body.subheadline || '',
      meta_description: body.meta_description || '',
      content: body.content || body,
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

// POST - Also handle POST for updates (some clients use POST instead of PUT)
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return PUT(request, { params })
}
