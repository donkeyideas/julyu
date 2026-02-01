import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner } from '@/lib/auth/store-portal-auth'

export async function PUT(request: NextRequest) {
  try {
    const { storeOwner, error, status } = await getStoreOwner(request)

    if (error || !storeOwner) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await request.json()
    const {
      business_name,
      business_type,
      business_address,
      business_phone,
      business_email,
      tax_id,
      business_license
    } = body

    // Validate required fields
    if (!business_name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Update store owner
    const { error: updateError } = await supabase
      .from('store_owners')
      .update({
        business_name,
        business_type: business_type || 'bodega',
        business_address: business_address || null,
        business_phone: business_phone || null,
        business_email: business_email || null,
        tax_id: tax_id || null,
        business_license: business_license || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeOwner.id)

    if (updateError) {
      console.error('[settings/business] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update business information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[settings/business] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    )
  }
}
