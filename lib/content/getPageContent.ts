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

export async function getPageContent(slug: string): Promise<PageContent | null> {
  try {
    const supabase = createServerClient()

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
