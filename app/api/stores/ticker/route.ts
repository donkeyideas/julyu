import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Returns active stores for the homepage ticker
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('store_ticker')
      .select('id, name, logo_url, website_url, parent_network')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('Error fetching store ticker:', error)
      return NextResponse.json({ stores: [] })
    }

    return NextResponse.json({ stores: data || [] })
  } catch (error) {
    console.error('Store ticker API error:', error)
    return NextResponse.json({ stores: [] })
  }
}
