import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { hasStoreOwnerAccount } from '@/lib/auth/store-portal-auth'
import { sendStoreApplicationSubmittedEmail, sendStoreAccountCreatedEmail } from '@/lib/services/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('[Store Apply] ====== NEW APPLICATION SUBMISSION ======')
  console.log('[Store Apply] Timestamp:', new Date().toISOString())

  try {
    // Verify environment before proceeding
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Store Apply] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    // Use anon client for auth checks
    const supabase = await createServerClient()
    // Use service role client for database operations (bypasses RLS)
    let supabaseAdmin: any
    try {
      supabaseAdmin = createServiceRoleClient() as any
      console.log('[Store Apply] Supabase clients initialized successfully')
    } catch (clientError) {
      console.error('[Store Apply] Failed to create service role client:', clientError)
      return NextResponse.json(
        { error: 'Database connection error. Please try again.', code: 'DB_CLIENT_ERROR' },
        { status: 500 }
      )
    }

    // Parse request body first to get email
    const body = await request.json()
    console.log('[Store Apply] Received application:', JSON.stringify(body, null, 2))

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
      // Check if registration is disabled before creating new accounts
      const { data: regSetting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'user_sign_in_enabled')
        .single()

      if (regSetting?.value?.enabled === false) {
        return NextResponse.json(
          { error: 'Registration is currently disabled. Please contact support.' },
          { status: 403 }
        )
      }

      // User not logged in - create account for them
      // Generate a temporary password
      const tempPassword = `Store${Math.random().toString(36).substring(2, 15)}!`

      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: businessEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for store owners
        user_metadata: {
          business_name: businessName,
          user_type: 'store_owner'
        }
      })

      if (signUpError || !newUser.user) {
        console.error('Sign up error:', signUpError)
        console.error('Sign up error details:', JSON.stringify(signUpError, null, 2))
        return NextResponse.json(
          {
            error: 'Failed to create account. This email may already be in use.',
            details: signUpError?.message || 'Unknown error',
            code: signUpError?.code || 'unknown'
          },
          { status: 400 }
        )
      }

      userId = newUser.user.id

      // Send email with temporary password
      const emailResult = await sendStoreAccountCreatedEmail({
        businessName,
        businessEmail,
        temporaryPassword: tempPassword,
      })

      if (!emailResult.success) {
        console.error('Failed to send account creation email:', emailResult.error)
        // Don't fail the entire request if email fails
      }

      console.log(`Created store owner account for ${businessEmail} and sent credentials email`)
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
      console.error('[Store Apply] Missing business info:', { businessName, businessType, businessAddress, businessPhone, businessEmail })
      return NextResponse.json(
        { error: 'Missing required business information' },
        { status: 400 }
      )
    }

    if (!storeName || !storeAddress || !storeCity || !storeState || !storeZip || !storePhone) {
      console.error('[Store Apply] Missing store info:', { storeName, storeAddress, storeCity, storeState, storeZip, storePhone })
      return NextResponse.json(
        { error: 'Missing required store information' },
        { status: 400 }
      )
    }

    console.log('[Store Apply] Validation passed, creating store owner...')

    // Start transaction - Create store owner first
    const { data: storeOwner, error: ownerError } = await supabaseAdmin
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
      console.error('[Store Apply] Store owner creation FAILED:', ownerError)
      console.error('[Store Apply] Error details:', JSON.stringify(ownerError, null, 2))
      return NextResponse.json(
        {
          error: 'Failed to create store owner account',
          details: ownerError.message || 'Unknown error',
          code: ownerError.code || 'unknown'
        },
        { status: 500 }
      )
    }
    console.log('[Store Apply] Store owner created successfully:', storeOwner.id)

    // VERIFY the store owner was actually created
    const { data: verifyOwner, error: verifyOwnerError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name')
      .eq('id', storeOwner.id)
      .single()

    if (verifyOwnerError || !verifyOwner) {
      console.error('[Store Apply] CRITICAL: Store owner insert verification FAILED!')
      console.error('[Store Apply] Verify error:', verifyOwnerError)
      return NextResponse.json(
        {
          error: 'Failed to save application. Please try again.',
          details: 'Data verification failed after insert',
          code: 'VERIFY_FAILED'
        },
        { status: 500 }
      )
    }
    console.log('[Store Apply] Store owner verified in database:', verifyOwner.business_name)

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
    const { data: bodegaStore, error: storeError } = await supabaseAdmin
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
      console.error('[Store Apply] Bodega store creation FAILED:', storeError)
      console.error('[Store Apply] Error details:', JSON.stringify(storeError, null, 2))

      // Rollback - delete store owner
      await supabaseAdmin
        .from('store_owners')
        .delete()
        .eq('id', storeOwner.id)

      return NextResponse.json(
        {
          error: 'Failed to create store location',
          details: storeError.message || 'Unknown error',
          code: storeError.code || 'unknown'
        },
        { status: 500 }
      )
    }
    console.log('[Store Apply] Bodega store created successfully:', bodegaStore.id)

    // VERIFY the bodega store was actually created
    const { data: verifyStore, error: verifyStoreError } = await supabaseAdmin
      .from('bodega_stores')
      .select('id, name')
      .eq('id', bodegaStore.id)
      .single()

    if (verifyStoreError || !verifyStore) {
      console.error('[Store Apply] CRITICAL: Bodega store insert verification FAILED!')
      console.error('[Store Apply] Verify error:', verifyStoreError)
      // Rollback store owner
      await supabaseAdmin.from('store_owners').delete().eq('id', storeOwner.id)
      return NextResponse.json(
        {
          error: 'Failed to save store location. Please try again.',
          details: 'Store data verification failed after insert',
          code: 'VERIFY_FAILED'
        },
        { status: 500 }
      )
    }
    console.log('[Store Apply] Bodega store verified in database:', verifyStore.name)

    // If POS system info provided, create a note (we'll implement full POS integration later)
    if (hasPosSystem && posSystemName) {
      // For now, just log it - will be used in Phase 2
      console.log(`Store ${storeOwner.id} uses POS: ${posSystemName}`)
    }

    // Send application submitted confirmation email
    const confirmationEmailResult = await sendStoreApplicationSubmittedEmail({
      businessName,
      businessEmail,
      storeName,
    })

    if (!confirmationEmailResult.success) {
      console.error('[Store Apply] Confirmation email FAILED:', confirmationEmailResult.error)
      // Don't fail the entire request if email fails
    } else {
      console.log('[Store Apply] Confirmation email sent successfully')
    }

    console.log('[Store Apply] ====== APPLICATION COMPLETE ======')
    console.log('[Store Apply] Store Owner ID:', storeOwner.id)
    console.log('[Store Apply] Bodega Store ID:', bodegaStore.id)
    console.log('[Store Apply] Status: pending')

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
    console.error('[Store Apply] ====== CRITICAL ERROR ======')
    console.error('[Store Apply] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Store Apply] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Store Apply] Full error:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing your application. Please try again.',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
