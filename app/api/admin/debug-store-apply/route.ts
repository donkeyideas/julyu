import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Debug endpoint to create a test store application
// DELETE THIS FILE AFTER DEBUGGING
export async function POST(request: NextRequest) {
  try {
    console.log('[Debug Store Apply] Creating test application...')

    const supabaseAdmin = createServiceRoleClient() as any

    // Check current count
    const { data: existingApps, error: countError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name, application_status')

    console.log('[Debug Store Apply] Existing applications:', existingApps?.length || 0)
    console.log('[Debug Store Apply] Existing apps:', JSON.stringify(existingApps, null, 2))

    // Create test store owner
    const testBusinessName = `Test Store ${Date.now()}`
    const testEmail = `test${Date.now()}@example.com`

    const { data: storeOwner, error: ownerError } = await supabaseAdmin
      .from('store_owners')
      .insert({
        user_id: null, // No associated user for test
        business_name: testBusinessName,
        business_type: 'bodega',
        business_address: '123 Test Street, Test City, TS 12345',
        business_phone: '555-123-4567',
        business_email: testEmail,
        application_status: 'pending',
        commission_rate: 15.00,
        accepts_orders: false,
        auto_accept_orders: false,
      })
      .select()
      .single()

    if (ownerError) {
      console.error('[Debug Store Apply] Store owner creation error:', ownerError)
      return NextResponse.json({
        error: 'Failed to create store owner',
        details: ownerError.message,
        code: ownerError.code
      }, { status: 500 })
    }

    console.log('[Debug Store Apply] Store owner created:', storeOwner.id)

    // Create test bodega store
    const { data: bodegaStore, error: storeError } = await supabaseAdmin
      .from('bodega_stores')
      .insert({
        store_owner_id: storeOwner.id,
        name: testBusinessName,
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        phone: '555-123-4567',
        is_active: false,
        verified: false,
      })
      .select()
      .single()

    if (storeError) {
      console.error('[Debug Store Apply] Bodega store creation error:', storeError)
      // Rollback
      await supabaseAdmin.from('store_owners').delete().eq('id', storeOwner.id)
      return NextResponse.json({
        error: 'Failed to create bodega store',
        details: storeError.message,
        code: storeError.code
      }, { status: 500 })
    }

    console.log('[Debug Store Apply] Bodega store created:', bodegaStore.id)

    // Verify by fetching all applications
    const { data: allApps, error: verifyError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name, application_status')

    console.log('[Debug Store Apply] After creation - Total apps:', allApps?.length || 0)

    return NextResponse.json({
      success: true,
      message: 'Test application created',
      storeOwner: {
        id: storeOwner.id,
        business_name: storeOwner.business_name,
        status: storeOwner.application_status
      },
      bodegaStore: {
        id: bodegaStore.id,
        name: bodegaStore.name
      },
      totalApplications: allApps?.length || 0
    })
  } catch (error) {
    console.error('[Debug Store Apply] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current state
// Add ?create=true to create a test application via GET
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient() as any
    const { searchParams } = new URL(request.url)
    const shouldCreate = searchParams.get('create') === 'true'

    // If create=true, create a test application
    if (shouldCreate) {
      console.log('[Debug] Creating test application via GET...')

      const testBusinessName = `Test Store ${Date.now()}`
      const testEmail = `test${Date.now()}@example.com`

      const { data: storeOwner, error: ownerError } = await supabaseAdmin
        .from('store_owners')
        .insert({
          user_id: null,
          business_name: testBusinessName,
          business_type: 'bodega',
          business_address: '123 Test Street, Test City, TS 12345',
          business_phone: '555-123-4567',
          business_email: testEmail,
          application_status: 'pending',
          commission_rate: 15.00,
          accepts_orders: false,
          auto_accept_orders: false,
        })
        .select()
        .single()

      if (ownerError) {
        console.error('[Debug] Store owner creation error:', ownerError)
        return NextResponse.json({
          error: 'Failed to create store owner',
          details: ownerError.message,
          code: ownerError.code
        }, { status: 500 })
      }

      const { data: bodegaStore, error: storeError } = await supabaseAdmin
        .from('bodega_stores')
        .insert({
          store_owner_id: storeOwner.id,
          name: testBusinessName,
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          phone: '555-123-4567',
          is_active: false,
          verified: false,
        })
        .select()
        .single()

      if (storeError) {
        await supabaseAdmin.from('store_owners').delete().eq('id', storeOwner.id)
        return NextResponse.json({
          error: 'Failed to create bodega store',
          details: storeError.message
        }, { status: 500 })
      }

      console.log('[Debug] Test application created:', storeOwner.id)
    }

    // Fetch all applications
    const { data: apps, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        id,
        business_name,
        business_email,
        application_status,
        created_at,
        bodega_stores(id, name, city, state)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: shouldCreate ? 'Test application created' : 'Current applications',
      count: apps?.length || 0,
      applications: apps || []
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
