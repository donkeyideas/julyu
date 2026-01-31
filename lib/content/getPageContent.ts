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

export interface PageSection {
  id: string
  section_key: string
  section_title: string
  content: Record<string, any>
  display_order: number
  is_visible: boolean
}

export interface PageWithSections {
  page: {
    id: string
    page_slug: string
    title: string
    meta_description: string
    meta_keywords: string[] | null
    og_image_url: string | null
    is_published: boolean
    published_at: string | null
    created_at: string
    updated_at: string
  } | null
  sections: PageSection[]
  content: Record<string, any>
}

// Legacy function - kept for backward compatibility
export async function getPageContent(slug: string): Promise<PageContent | null> {
  try {
    const supabase = createServiceRoleClient() as any

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', `page_content_${slug}`)
      .single()

    if (error || !data) {
      return null
    }

    return data.value as PageContent
  } catch (error) {
    console.error(`Error fetching page content for ${slug}:`, error)
    return null
  }
}

// New function - fetches page with all sections from proper CMS tables
export async function getPageWithSections(slug: string): Promise<PageWithSections> {
  try {
    const supabase = createServiceRoleClient() as any

    // Fetch the page
    const { data: page, error: pageError } = await supabase
      .from('page_content')
      .select('*')
      .eq('page_slug', slug)
      .single()

    if (pageError) {
      console.error(`Error fetching page ${slug}:`, pageError)
      return { page: null, sections: [], content: {} }
    }

    // Fetch all sections for this page
    const { data: sections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('id, section_key, section_title, content, display_order, is_visible')
      .eq('page_id', page.id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (sectionsError) {
      console.error(`Error fetching sections for page ${slug}:`, sectionsError)
      return { page, sections: [], content: {} }
    }

    // Convert sections array to object keyed by section_key for easier access
    const content = (sections || []).reduce((acc: Record<string, any>, section: PageSection) => {
      acc[section.section_key] = section.content
      return acc
    }, {} as Record<string, any>)

    return {
      page,
      sections: sections || [],
      content
    }
  } catch (error) {
    console.error(`Error in getPageWithSections for ${slug}:`, error)
    return { page: null, sections: [], content: {} }
  }
}

// Get a specific section for a page
export async function getPageSection(slug: string, sectionKey: string): Promise<Record<string, any> | null> {
  try {
    const supabase = createServiceRoleClient() as any

    // First get the page ID
    const { data: page, error: pageError } = await supabase
      .from('page_content')
      .select('id')
      .eq('page_slug', slug)
      .single()

    if (pageError || !page) {
      return null
    }

    // Then get the specific section
    const { data: section, error: sectionError } = await supabase
      .from('page_sections')
      .select('content')
      .eq('page_id', page.id)
      .eq('section_key', sectionKey)
      .eq('is_visible', true)
      .single()

    if (sectionError || !section) {
      return null
    }

    return section.content
  } catch (error) {
    console.error(`Error fetching section ${sectionKey} for page ${slug}:`, error)
    return null
  }
}
