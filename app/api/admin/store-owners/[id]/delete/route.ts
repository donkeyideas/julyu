import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[Delete Store Owner] ====== STARTING DELETE ======')
  console.log('[Delete Store Owner] Timestamp:', new Date().toISOString())

  try {
    // Validate environment
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Delete Store Owner] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    let supabaseAdmin: any
    try {
      supabaseAdmin = createServiceRoleClient() as any
    } catch (clientError) {
      console.error('[Delete Store Owner] Failed to create service role client:', clientError)
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DB_CLIENT_ERROR' },
        { status: 500 }
      )
    }

    const { id } = await params
    console.log('[Delete Store Owner] ID received:', id, 'Type:', typeof id)

    if (!id) {
      return NextResponse.json(
        { error: 'Store owner ID is required', code: 'MISSING_ID' },
        { status: 400 }
      )
    }

    // First, let's verify the record exists by listing all store owners
    const { data: allOwners, error: listError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name')

    console.log('[Delete Store Owner] All store owners in DB:', allOwners?.map((o: any) => ({ id: o.id, name: o.business_name })))
    console.log('[Delete Store Owner] Looking for ID:', id)
    console.log('[Delete Store Owner] ID exists in list:', allOwners?.some((o: any) => o.id === id))

    // Get store owner to find user_id
    const { data: storeOwner, error: fetchError } = await supabaseAdmin
      .from('store_owners')
      .select('user_id, business_name')
      .eq('id', id)
      .single()

    console.log('[Delete Store Owner] Fetch result:', {
      found: !!storeOwner,
      businessName: storeOwner?.business_name,
      hasUserId: !!storeOwner?.user_id,
      error: fetchError?.message
    })

    if (fetchError || !storeOwner) {
      console.error('[Delete Store Owner] Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Store owner not found' },
        { status: 404 }
      )
    }

    // Delete bodega_stores first (in case cascade doesn't work)
    console.log('[Delete Store Owner] Deleting associated bodega stores...')
    const { error: storesError } = await supabaseAdmin
      .from('bodega_stores')
      .delete()
      .eq('store_owner_id', id)

    if (storesError) {
      console.error('[Delete Store Owner] Bodega stores delete error:', storesError)
      // Continue anyway - cascade might handle it
    }

    // Delete from store_owners table
    console.log('[Delete Store Owner] Deleting store owner record...')
    const { error: deleteError } = await supabaseAdmin
      .from('store_owners')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[Delete Store Owner] Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete store owner', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log('[Delete Store Owner] Store owner deleted from database')

    // Delete user from auth if they have a user_id
    if (storeOwner.user_id) {
      console.log('[Delete Store Owner] Deleting auth user:', storeOwner.user_id)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        storeOwner.user_id
      )

      if (authError) {
        console.error('[Delete Store Owner] Auth delete error:', authError)
        // Don't fail the entire request if auth deletion fails
        // The database record is already deleted
      } else {
        console.log('[Delete Store Owner] Auth user deleted successfully')
      }
    }

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('store_owners')
      .select('id')
      .eq('id', id)
      .single()

    if (!verifyError && verifyData) {
      console.error('[Delete Store Owner] VERIFICATION FAILED: Record still exists!')
      return NextResponse.json(
        { error: 'Delete may not have completed. Please try again.', code: 'VERIFY_FAILED' },
        { status: 500 }
      )
    }

    console.log('[Delete Store Owner] ====== DELETION COMPLETE ======')
    console.log('[Delete Store Owner] Deleted:', storeOwner.business_name)

    return NextResponse.json({
      success: true,
      message: 'Store owner deleted successfully',
      data: {
        deletedBusinessName: storeOwner.business_name,
        authUserDeleted: !!storeOwner.user_id
      }
    })
  } catch (error) {
    console.error('[Delete Store Owner] ====== CRITICAL ERROR ======')
    console.error('[Delete Store Owner] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Delete Store Owner] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Delete Store Owner] Full error:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete store owner due to an internal error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
