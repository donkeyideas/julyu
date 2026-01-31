import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST - Update sort_order for multiple partners
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { partners } = body

    if (!partners || !Array.isArray(partners)) {
      return NextResponse.json(
        { error: 'Partners array is required' },
        { status: 400 }
      )
    }

    // Validate partners array
    for (const partner of partners) {
      if (!partner.id || typeof partner.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Each partner must have id and sort_order' },
          { status: 400 }
        )
      }
    }

    // Update each partner's sort_order
    const updates = partners.map((partner: { id: string; sort_order: number }) =>
      supabase
        .from('delivery_partners')
        .update({ sort_order: partner.sort_order })
        .eq('id', partner.id)
    )

    await Promise.all(updates)

    // Fetch updated partners
    const { data: updatedPartners, error: fetchError } = await supabase
      .from('delivery_partners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (fetchError) throw fetchError

    return NextResponse.json({ partners: updatedPartners })
  } catch (error) {
    console.error('Error reordering delivery partners:', error)
    return NextResponse.json(
      { error: 'Failed to reorder delivery partners' },
      { status: 500 }
    )
  }
}
