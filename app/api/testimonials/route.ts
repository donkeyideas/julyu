import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Public API - no authentication required
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if testimonials section is enabled
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_testimonials_enabled')
      .single()

    // If setting exists and is explicitly false, return empty array
    if (setting && setting.value === false) {
      return NextResponse.json({ testimonials: [], enabled: false })
    }

    // Fetch active testimonials
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, author_name, author_title, author_location, quote, savings_amount, rating, is_featured')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Testimonials Public API] Error fetching:', error)
      return NextResponse.json({ testimonials: [], enabled: true })
    }

    return NextResponse.json({ testimonials: data || [], enabled: true })
  } catch (error) {
    console.error('[Testimonials Public API] Error:', error)
    return NextResponse.json({ testimonials: [], enabled: true })
  }
}
