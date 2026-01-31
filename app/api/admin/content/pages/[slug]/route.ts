import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// GET - Fetch specific page with all sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServiceRoleClient() as any

    // Fetch the page
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
      return NextResponse.json({ page: null, sections: [], content: {} })
    }

    // Fetch all sections for this page
    const { data: sections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', page.id)
      .order('display_order', { ascending: true })

    if (sectionsError) {
      console.error('[Admin Pages API] Error fetching sections:', sectionsError)
    }

    // Convert sections array to object keyed by section_key
    const content = (sections || []).reduce((acc: Record<string, any>, section: any) => {
      acc[section.section_key] = section.content
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      page,
      sections: sections || [],
      content
    })
  } catch (error: any) {
    console.error('[Admin Pages API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update page and sections
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { page: pageData, sections: sectionsData } = body

    const supabase = createServiceRoleClient() as any

    // Get or create the page
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
      const updateData: Record<string, any> = {}
      if (pageData?.title !== undefined) updateData.title = pageData.title
      if (pageData?.meta_description !== undefined) updateData.meta_description = pageData.meta_description
      if (pageData?.meta_keywords !== undefined) updateData.meta_keywords = pageData.meta_keywords
      if (pageData?.og_image_url !== undefined) updateData.og_image_url = pageData.og_image_url
      if (pageData?.is_published !== undefined) updateData.is_published = pageData.is_published

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('page_content')
          .update(updateData)
          .eq('id', pageId)

        if (updateError) {
          console.error('[Admin Pages API] Error updating page:', updateError)
          return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
        }
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
    if (sectionsData && typeof sectionsData === 'object') {
      // Handle sections as array or object
      const sectionsArray = Array.isArray(sectionsData)
        ? sectionsData
        : Object.entries(sectionsData).map(([key, content], index) => ({
            section_key: key,
            content,
            display_order: index
          }))

      for (const section of sectionsArray) {
        const sectionKey = section.section_key
        const sectionContent = section.content

        const { error: sectionError } = await supabase
          .from('page_sections')
          .upsert({
            page_id: pageId,
            section_key: sectionKey,
            section_title: section.section_title || sectionKey,
            content: sectionContent,
            display_order: section.display_order ?? 0,
            is_visible: section.is_visible ?? true
          }, {
            onConflict: 'page_id,section_key'
          })

        if (sectionError) {
          console.error(`[Admin Pages API] Error updating section ${sectionKey}:`, sectionError)
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

// POST - Also handle POST for updates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return PUT(request, { params })
}

// DELETE - Delete a section from a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const sectionKey = searchParams.get('section')

    if (!sectionKey) {
      return NextResponse.json({ error: 'Section key is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient() as any

    // Get the page ID
    const { data: page, error: pageError } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', slug)
      .single()

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Delete the section
    const { error: deleteError } = await supabase
      .from('page_sections')
      .delete()
      .eq('page_id', page.id)
      .eq('section_key', sectionKey)

    if (deleteError) {
      console.error('[Admin Pages API] Error deleting section:', deleteError)
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
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
