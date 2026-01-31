import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendStoreApprovalEmail, sendStoreRejectionEmail } from '@/lib/services/email'

// Unified Store Management API
// GET: List all stores
// PUT: Update store (approve/reject)
// DELETE: Delete store

function log(action: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[Store Manage ${action}] ${timestamp} - ${message}`, data ? JSON.stringify(data) : '')
}

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createServiceRoleClient() as any
}

// GET - List all store applications
export async function GET(request: NextRequest) {
  log('GET', '====== FETCHING ALL STORES ======')

  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: stores, error } = await supabaseAdmin
      .from('store_owners')
      .select(`
        id,
        user_id,
        business_name,
        business_type,
        business_address,
        business_phone,
        business_email,
        tax_id,
        business_license,
        application_status,
        commission_rate,
        accepts_orders,
        approval_date,
        rejection_reason,
        created_at,
        updated_at,
        bodega_stores (
          id,
          name,
          address,
          city,
          state,
          zip,
          phone,
          is_active,
          verified
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      log('GET', 'Query error', error)
      return NextResponse.json({
        error: 'Failed to fetch stores',
        details: error.message,
        stores: []
      }, { status: 500 })
    }

    log('GET', `Found ${stores?.length || 0} stores`, {
      ids: stores?.map((s: any) => ({ id: s.id, name: s.business_name }))
    })

    return NextResponse.json({
      stores: stores || [],
      count: stores?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log('GET', 'Critical error', error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stores: []
    }, { status: 500 })
  }
}

// PUT - Update store (approve/reject)
export async function PUT(request: NextRequest) {
  log('PUT', '====== UPDATING STORE ======')

  try {
    const body = await request.json()
    const { id, action, reason } = body

    log('PUT', 'Request received', { id, action, reason })

    if (!id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 })
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // First verify the store exists
    const { data: existingStore, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name, business_email, application_status')
      .eq('id', id)
      .single()

    if (fetchError || !existingStore) {
      log('PUT', 'Store not found', { id, error: fetchError?.message })
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    log('PUT', 'Found store', existingStore)

    // Update based on action
    if (action === 'approve') {
      const { error: updateError } = await supabaseAdmin
        .from('store_owners')
        .update({
          application_status: 'approved',
          approval_date: new Date().toISOString(),
          accepts_orders: true
        })
        .eq('id', id)

      if (updateError) {
        log('PUT', 'Approve update failed', updateError)
        return NextResponse.json({ error: 'Failed to approve', details: updateError.message }, { status: 500 })
      }

      // Activate associated stores
      await supabaseAdmin
        .from('bodega_stores')
        .update({ is_active: true })
        .eq('store_owner_id', id)

      // Send approval email
      if (existingStore.business_email) {
        try {
          await sendStoreApprovalEmail({
            businessName: existingStore.business_name,
            businessEmail: existingStore.business_email
          })
          log('PUT', 'Approval email sent')
        } catch (emailError) {
          log('PUT', 'Email send failed (non-fatal)', emailError)
        }
      }

      log('PUT', 'Store approved successfully', { id, name: existingStore.business_name })

      return NextResponse.json({
        success: true,
        message: 'Store approved successfully',
        store: { id, status: 'approved' }
      })

    } else if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('store_owners')
        .update({
          application_status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', id)

      if (updateError) {
        log('PUT', 'Reject update failed', updateError)
        return NextResponse.json({ error: 'Failed to reject', details: updateError.message }, { status: 500 })
      }

      // Send rejection email
      if (existingStore.business_email) {
        try {
          await sendStoreRejectionEmail({
            businessName: existingStore.business_name,
            businessEmail: existingStore.business_email,
            reason: reason
          })
          log('PUT', 'Rejection email sent')
        } catch (emailError) {
          log('PUT', 'Email send failed (non-fatal)', emailError)
        }
      }

      log('PUT', 'Store rejected successfully', { id, name: existingStore.business_name })

      return NextResponse.json({
        success: true,
        message: 'Store rejected successfully',
        store: { id, status: 'rejected' }
      })
    }

  } catch (error) {
    log('PUT', 'Critical error', error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Delete a store
export async function DELETE(request: NextRequest) {
  log('DELETE', '====== DELETING STORE ======')

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    log('DELETE', 'Request received', { id })

    if (!id) {
      return NextResponse.json({ error: 'Store ID is required (use ?id=xxx)' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // List all stores first for debugging
    const { data: allStores } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name')

    log('DELETE', 'All stores in database', allStores)
    log('DELETE', 'Looking for ID', { id, type: typeof id })

    const found = allStores?.find((s: any) => s.id === id)
    log('DELETE', 'ID match result', { found: !!found, foundName: found?.business_name })

    // Verify the store exists
    const { data: store, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('id, user_id, business_name')
      .eq('id', id)
      .single()

    if (fetchError || !store) {
      log('DELETE', 'Store not found', {
        id,
        error: fetchError?.message,
        allStoreIds: allStores?.map((s: any) => s.id)
      })
      return NextResponse.json({
        error: 'Store not found',
        debug: {
          requestedId: id,
          availableIds: allStores?.map((s: any) => s.id) || []
        }
      }, { status: 404 })
    }

    log('DELETE', 'Found store to delete', store)

    // Delete bodega_stores first
    const { error: bodegaError } = await supabaseAdmin
      .from('bodega_stores')
      .delete()
      .eq('store_owner_id', id)

    if (bodegaError) {
      log('DELETE', 'Bodega stores delete error (continuing)', bodegaError)
    }

    // Delete store_owner
    const { error: deleteError } = await supabaseAdmin
      .from('store_owners')
      .delete()
      .eq('id', id)

    if (deleteError) {
      log('DELETE', 'Delete failed', deleteError)
      return NextResponse.json({
        error: 'Failed to delete store',
        details: deleteError.message
      }, { status: 500 })
    }

    // Verify deletion
    const { data: verifyData } = await supabaseAdmin
      .from('store_owners')
      .select('id')
      .eq('id', id)
      .single()

    if (verifyData) {
      log('DELETE', 'VERIFICATION FAILED - store still exists')
      return NextResponse.json({
        error: 'Delete verification failed',
        details: 'Store still exists after delete'
      }, { status: 500 })
    }

    // Delete auth user if exists
    if (store.user_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(store.user_id)
        log('DELETE', 'Auth user deleted')
      } catch (authError) {
        log('DELETE', 'Auth user delete failed (non-fatal)', authError)
      }
    }

    log('DELETE', '====== DELETE COMPLETE ======', {
      id,
      businessName: store.business_name
    })

    return NextResponse.json({
      success: true,
      message: 'Store deleted successfully',
      deleted: {
        id: store.id,
        businessName: store.business_name
      }
    })

  } catch (error) {
    log('DELETE', 'Critical error', error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
