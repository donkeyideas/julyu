import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Simple endpoint to test if database writes work
export async function GET(request: NextRequest) {
  console.log('[DB Write Test] ====== STARTING TEST ======')

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Check service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
        results
      }, { status: 500 })
    }

    const supabaseAdmin = createServiceRoleClient() as any

    // Test 1: Count existing store owners
    const { data: existingOwners, error: countError } = await supabaseAdmin
      .from('store_owners')
      .select('id, business_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    results.tests.existingOwners = {
      count: existingOwners?.length || 0,
      recent: existingOwners?.map((o: any) => ({ id: o.id, name: o.business_name, created: o.created_at })) || [],
      error: countError?.message || null
    }

    // Test 2: Try to insert a test store owner
    const testBusinessName = `TEST_WRITE_${Date.now()}`
    console.log('[DB Write Test] Inserting test record:', testBusinessName)

    const { data: testOwner, error: insertError } = await supabaseAdmin
      .from('store_owners')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        business_name: testBusinessName,
        business_type: 'test',
        business_address: 'Test Address',
        business_phone: '000-000-0000',
        business_email: 'test@test.com',
        application_status: 'pending',
        commission_rate: 15.00,
        accepts_orders: false,
        auto_accept_orders: false,
      })
      .select()
      .single()

    results.tests.insert = {
      success: !!testOwner,
      insertedId: testOwner?.id || null,
      insertedName: testOwner?.business_name || null,
      error: insertError?.message || null,
      errorCode: insertError?.code || null,
      errorDetails: insertError?.details || null
    }

    if (testOwner) {
      // Test 3: Verify the insert by reading it back
      console.log('[DB Write Test] Verifying insert:', testOwner.id)
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('store_owners')
        .select('*')
        .eq('id', testOwner.id)
        .single()

      results.tests.verify = {
        success: !!verifyData,
        verified: verifyData?.business_name === testBusinessName,
        error: verifyError?.message || null
      }

      // Test 4: Delete the test record
      console.log('[DB Write Test] Cleaning up test record')
      const { error: deleteError } = await supabaseAdmin
        .from('store_owners')
        .delete()
        .eq('id', testOwner.id)

      results.tests.cleanup = {
        success: !deleteError,
        error: deleteError?.message || null
      }

      // Verify deletion
      const { data: afterDelete } = await supabaseAdmin
        .from('store_owners')
        .select('id')
        .eq('id', testOwner.id)
        .single()

      results.tests.cleanupVerify = {
        recordGone: !afterDelete
      }
    }

    // Final count
    const { count } = await supabaseAdmin
      .from('store_owners')
      .select('*', { count: 'exact', head: true })

    results.finalCount = count

    console.log('[DB Write Test] ====== TEST COMPLETE ======')
    console.log('[DB Write Test] Results:', JSON.stringify(results, null, 2))

    // Determine overall status
    const allPassed = results.tests.insert?.success &&
                      results.tests.verify?.success &&
                      results.tests.cleanup?.success

    return NextResponse.json({
      status: allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
      results
    })

  } catch (error) {
    console.error('[DB Write Test] Critical error:', error)
    return NextResponse.json({
      status: 'CRITICAL_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}
