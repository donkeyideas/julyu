import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// GET - Fetch all pages or a specific page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    const supabase = createServiceRoleClient()

    if (slug) {
      // Fetch specific page with sections
      const { data: page, error: pageError } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_slug', slug)
        .single()

      if (pageError && pageError.code !== 'PGRST116') {
        console.error('[Admin Pages API] Error fetching page:', pageError)
        return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
      }

      if (!page) {
        return NextResponse.json({ page: null, sections: [] })
      }

      // Fetch sections for this page
      const { data: sections, error: sectionsError } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', page.id)
        .order('display_order', { ascending: true })

      if (sectionsError) {
        console.error('[Admin Pages API] Error fetching sections:', sectionsError)
      }

      return NextResponse.json({
        page,
        sections: sections || []
      })
    }

    // Fetch all pages
    const { data: pages, error } = await supabase
      .from('page_content')
      .select('*')
      .order('page_slug', { ascending: true })

    if (error) {
      console.error('[Admin Pages API] Error fetching all pages:', error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    return NextResponse.json({ pages: pages || [] })
  } catch (error: any) {
    console.error('[Admin Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page_slug, title, meta_description } = body

    if (!page_slug) {
      return NextResponse.json({ error: 'Page slug is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('page_content')
      .insert({
        page_slug,
        title: title || '',
        meta_description: meta_description || '',
        is_published: false
      })
      .select()
      .single()

    if (error) {
      console.error('[Admin Pages API] Error creating page:', error)
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: data })
  } catch (error: any) {
    console.error('[Admin Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update page metadata and sections
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, page: pageData, sections: sectionsData } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // First, get or create the page
    let { data: existingPage, error: fetchError } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', slug)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Admin Pages API] Error checking page:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
    }

    let pageId = existingPage?.id

    // Update or create the page
    if (pageId) {
      const { error: updateError } = await supabase
        .from('page_content')
        .update({
          title: pageData?.title,
          meta_description: pageData?.meta_description,
          meta_keywords: pageData?.meta_keywords,
          og_image_url: pageData?.og_image_url,
          is_published: pageData?.is_published ?? true
        })
        .eq('id', pageId)

      if (updateError) {
        console.error('[Admin Pages API] Error updating page:', updateError)
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
      }
    } else {
      const { data: newPage, error: createError } = await supabase
        .from('page_content')
        .insert({
          page_slug: slug,
          title: pageData?.title || '',
          meta_description: pageData?.meta_description || '',
          is_published: true,
          published_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError) {
        console.error('[Admin Pages API] Error creating page:', createError)
        return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
      }

      pageId = newPage.id
    }

    // Update sections if provided
    if (sectionsData && Array.isArray(sectionsData)) {
      for (const section of sectionsData) {
        const { error: sectionError } = await supabase
          .from('page_sections')
          .upsert({
            page_id: pageId,
            section_key: section.section_key,
            section_title: section.section_title || section.section_key,
            content: section.content,
            display_order: section.display_order ?? 0,
            is_visible: section.is_visible ?? true
          }, {
            onConflict: 'page_id,section_key'
          })

        if (sectionError) {
          console.error(`[Admin Pages API] Error updating section ${section.section_key}:`, sectionError)
        }
      }
    }

    // Revalidate the page
    try {
      revalidatePath(`/${slug}`)
      if (slug === 'home') {
        revalidatePath('/')
      }
    } catch (revalidateError) {
      console.error('[Admin Pages API] Error revalidating:', revalidateError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Admin Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
