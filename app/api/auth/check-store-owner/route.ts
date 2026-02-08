import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ isStoreOwner: false })
    }

    const supabase = createServiceRoleClient() as any

    // Check if user is an approved store owner
    const { data: storeOwner, error } = await supabase
      .from('store_owners')
      .select('id, application_status')
      .eq('user_id', userId)
      .eq('application_status', 'approved')
      .single()

    if (error || !storeOwner) {
      return NextResponse.json({ isStoreOwner: false })
    }

    return NextResponse.json({
      isStoreOwner: true,
      storeOwnerId: (storeOwner as any).id
    })

  } catch (error) {
    console.error('[check-store-owner] Error:', error)
    return NextResponse.json({ isStoreOwner: false })
  }
}
