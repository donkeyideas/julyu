import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Public API - no authentication required
// Fetches page content and sections for frontend rendering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerClient()

    // Fetch the page (must be published)
    const { data: page, error: pageError } = await supabase
      .from('page_content')
      .select('id, page_slug, title, meta_description, meta_keywords, og_image_url, is_published')
      .eq('page_slug', slug)
      .eq('is_published', true)
      .single()

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Fetch all visible sections for this page
    const { data: sections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('section_key, section_title, content, display_order')
      .eq('page_id', page.id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (sectionsError) {
      console.error(`[Content API] Error fetching sections for ${slug}:`, sectionsError)
    }

    // Convert sections array to object keyed by section_key
    const content = (sections || []).reduce((acc: Record<string, any>, section: any) => {
      acc[section.section_key] = section.content
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      page: {
        slug: page.page_slug,
        title: page.title,
        meta_description: page.meta_description,
        meta_keywords: page.meta_keywords,
        og_image_url: page.og_image_url
      },
      sections: sections || [],
      content
    })
  } catch (error) {
    console.error('[Content API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
