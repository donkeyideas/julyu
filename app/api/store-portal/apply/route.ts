import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { hasStoreOwnerAccount } from '@/lib/auth/store-portal-auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Parse request body first to get email
    const body = await request.json()
    const {
      businessName,
      businessType,
      businessAddress,
      businessPhone,
      businessEmail,
      taxId,
      businessLicense,
      storeName,
      storeAddress,
      storeCity,
      storeState,
      storeZip,
      storePhone,
      hasPosSystem,
      posSystemName,
    } = body

    // Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let userId: string

    if (!user) {
      // User not logged in - create account for them
      // Generate a temporary password
      const tempPassword = `Store${Math.random().toString(36).substring(2, 15)}!`

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: businessEmail,
        password: tempPassword,
        options: {
          data: {
            business_name: businessName,
            user_type: 'store_owner'
          }
        }
      })

      if (signUpError || !newUser.user) {
        console.error('Sign up error:', signUpError)
        return NextResponse.json(
          { error: 'Failed to create account. This email may already be in use.' },
          { status: 400 }
        )
      }

      userId = newUser.user.id

      // TODO: Send email with temporary password and instructions to reset
      console.log(`Created store owner account for ${businessEmail} with temp password`)
    } else {
      userId = user.id

      // Check if logged-in user already has a store owner account
      const hasAccount = await hasStoreOwnerAccount(userId)
      if (hasAccount) {
        return NextResponse.json(
          { error: 'You already have a store owner account' },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!businessName || !businessType || !businessAddress || !businessPhone || !businessEmail) {
      return NextResponse.json(
        { error: 'Missing required business information' },
        { status: 400 }
      )
    }

    if (!storeName || !storeAddress || !storeCity || !storeState || !storeZip || !storePhone) {
      return NextResponse.json(
        { error: 'Missing required store information' },
        { status: 400 }
      )
    }

    // Start transaction - Create store owner first
    const { data: storeOwner, error: ownerError } = await supabase
      .from('store_owners')
      .insert({
        user_id: userId,
        business_name: businessName,
        business_type: businessType,
        business_address: businessAddress,
        business_phone: businessPhone,
        business_email: businessEmail,
        tax_id: taxId || null,
        business_license: businessLicense || null,
        application_status: 'pending',
        commission_rate: 15.00, // Default rate (will be set from commission_tiers)
        accepts_orders: false, // Will be enabled after approval
        auto_accept_orders: false,
      })
      .select()
      .single()

    if (ownerError) {
      console.error('Store owner creation error:', ownerError)
      return NextResponse.json(
        { error: 'Failed to create store owner account' },
        { status: 500 }
      )
    }

    // Geocode the store address
    let latitude: number | null = null
    let longitude: number | null = null

    try {
      // Try to geocode the full address
      const fullAddress = `${storeAddress}, ${storeCity}, ${storeState} ${storeZip}`
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      )
      const geocodeData = await geocodeResponse.json()

      if (geocodeData.status === 'OK' && geocodeData.results[0]) {
        latitude = geocodeData.results[0].geometry.location.lat
        longitude = geocodeData.results[0].geometry.location.lng
      }
    } catch (geocodeError) {
      console.error('Geocoding error:', geocodeError)
      // Continue without coordinates - can be set later
    }

    // Create bodega store
    const { data: bodegaStore, error: storeError } = await supabase
      .from('bodega_stores')
      .insert({
        store_owner_id: storeOwner.id,
        name: storeName,
        address: storeAddress,
        city: storeCity,
        state: storeState,
        zip: storeZip,
        phone: storePhone,
        latitude,
        longitude,
        is_active: false, // Will be activated after approval
        verified: false,
      })
      .select()
      .single()

    if (storeError) {
      console.error('Bodega store creation error:', storeError)

      // Rollback - delete store owner
      await supabase
        .from('store_owners')
        .delete()
        .eq('id', storeOwner.id)

      return NextResponse.json(
        { error: 'Failed to create store location' },
        { status: 500 }
      )
    }

    // If POS system info provided, create a note (we'll implement full POS integration later)
    if (hasPosSystem && posSystemName) {
      // For now, just log it - will be used in Phase 2
      console.log(`Store ${storeOwner.id} uses POS: ${posSystemName}`)
    }

    // Send notification email (implement later)
    // TODO: Send email to admin for review
    // TODO: Send confirmation email to store owner

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        storeOwnerId: storeOwner.id,
        storeId: bodegaStore.id,
        status: 'pending',
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
