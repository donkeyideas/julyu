import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - List active delivery partners for frontend
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const retailer = searchParams.get('retailer')?.toLowerCase()

    let query = supabase
      .from('delivery_partners')
      .select(`
        id,
        name,
        display_name,
        slug,
        description,
        logo_url,
        icon_letter,
        brand_color,
        base_url,
        deep_link_template,
        supports_deep_linking,
        supports_search_url,
        supported_retailers
      `)
      .eq('is_active', true)
      .eq('show_in_modal', true)
      .order('sort_order', { ascending: true })

    const { data: partners, error } = await query

    if (error) throw error

    // Filter by retailer if provided
    let filteredPartners = partners || []
    if (retailer && filteredPartners.length > 0) {
      filteredPartners = filteredPartners.filter(partner => {
        const supportedRetailers = partner.supported_retailers as string[] | null
        // If no retailers specified, assume it supports all
        if (!supportedRetailers || supportedRetailers.length === 0) return true
        // Check if the retailer is in the supported list
        return supportedRetailers.some(r =>
          r.toLowerCase() === retailer ||
          retailer.includes(r.toLowerCase()) ||
          r.toLowerCase().includes(retailer)
        )
      })
    }

    return NextResponse.json({ partners: filteredPartners })
  } catch (error) {
    console.error('Error fetching delivery partners:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery partners' }, { status: 500 })
  }
}
