import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface TestResult {
  step: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  data?: any
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = []
  let testStoreOwnerId: string | null = null
  let testUserId: string | null = null
  let testBodegaStoreId: string | null = null

  const testEmail = `uat-test-${Date.now()}@julyu-test.local`
  const testBusinessName = `UAT Test Business ${Date.now()}`

  console.log('[UAT Test] ====== STARTING UAT TEST ======')
  console.log('[UAT Test] Test email:', testEmail)

  try {
    const supabaseAdmin = createServiceRoleClient() as any

    // Step 1: Create test auth user
    console.log('[UAT Test] Step 1: Creating test auth user...')
    try {
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          business_name: testBusinessName,
          user_type: 'store_owner',
          is_uat_test: true
        }
      })

      if (userError || !newUser.user) {
        results.push({
          step: '1. Create test auth user',
          status: 'fail',
          message: `Failed to create auth user: ${userError?.message || 'Unknown error'}`,
          data: { error: userError }
        })
      } else {
        testUserId = newUser.user.id
        results.push({
          step: '1. Create test auth user',
          status: 'pass',
          message: `Created auth user: ${testUserId}`,
          data: { userId: testUserId }
        })
      }
    } catch (error) {
      results.push({
        step: '1. Create test auth user',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
      })
    }

    // Step 2: Create store_owner record
    if (testUserId) {
      console.log('[UAT Test] Step 2: Creating store_owner record...')
      try {
        const { data: storeOwner, error: ownerError } = await supabaseAdmin
          .from('store_owners')
          .insert({
            user_id: testUserId,
            business_name: testBusinessName,
            business_type: 'bodega',
            business_address: '123 Test Street, Test City, TS 12345',
            business_phone: '555-555-5555',
            business_email: testEmail,
            tax_id: 'UAT-TEST-TAX',
            business_license: 'UAT-TEST-LICENSE',
            application_status: 'pending',
            commission_rate: 15.00,
            accepts_orders: false,
          })
          .select()
          .single()

        if (ownerError || !storeOwner) {
          results.push({
            step: '2. Create store_owner record',
            status: 'fail',
            message: `Failed to create store_owner: ${ownerError?.message || 'Unknown'}`,
            data: { error: ownerError }
          })
        } else {
          testStoreOwnerId = storeOwner.id
          results.push({
            step: '2. Create store_owner record',
            status: 'pass',
            message: `Created store_owner: ${testStoreOwnerId}`,
            data: { storeOwnerId: testStoreOwnerId, status: storeOwner.application_status }
          })
        }
      } catch (error) {
        results.push({
          step: '2. Create store_owner record',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
        })
      }
    } else {
      results.push({
        step: '2. Create store_owner record',
        status: 'skip',
        message: 'Skipped - no test user created',
      })
    }

    // Step 3: Create bodega_store record
    if (testStoreOwnerId) {
      console.log('[UAT Test] Step 3: Creating bodega_store record...')
      try {
        const { data: bodegaStore, error: storeError } = await supabaseAdmin
          .from('bodega_stores')
          .insert({
            store_owner_id: testStoreOwnerId,
            name: `${testBusinessName} Store`,
            address: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            zip: '12345',
            phone: '555-555-5555',
            latitude: 40.7128,
            longitude: -74.0060,
            is_active: false,
            verified: false,
          })
          .select()
          .single()

        if (storeError || !bodegaStore) {
          results.push({
            step: '3. Create bodega_store record',
            status: 'fail',
            message: `Failed to create bodega_store: ${storeError?.message || 'Unknown'}`,
            data: { error: storeError }
          })
        } else {
          testBodegaStoreId = bodegaStore.id
          results.push({
            step: '3. Create bodega_store record',
            status: 'pass',
            message: `Created bodega_store: ${testBodegaStoreId}`,
            data: { bodegaStoreId: testBodegaStoreId }
          })
        }
      } catch (error) {
        results.push({
          step: '3. Create bodega_store record',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
        })
      }
    } else {
      results.push({
        step: '3. Create bodega_store record',
        status: 'skip',
        message: 'Skipped - no store_owner created',
      })
    }

    // Step 4: Verify application appears in fetch query
    if (testStoreOwnerId) {
      console.log('[UAT Test] Step 4: Verifying application appears in admin fetch...')
      try {
        const { data: applications, error: fetchError } = await supabaseAdmin
          .from('store_owners')
          .select(`*, bodega_stores(*)`)
          .eq('id', testStoreOwnerId)
          .single()

        if (fetchError || !applications) {
          results.push({
            step: '4. Verify application appears in admin fetch',
            status: 'fail',
            message: `Failed to fetch application: ${fetchError?.message || 'Not found'}`,
            data: { error: fetchError }
          })
        } else {
          results.push({
            step: '4. Verify application appears in admin fetch',
            status: 'pass',
            message: `Application found with status: ${applications.application_status}`,
            data: {
              businessName: applications.business_name,
              status: applications.application_status,
              hasStores: applications.bodega_stores?.length > 0
            }
          })
        }
      } catch (error) {
        results.push({
          step: '4. Verify application appears in admin fetch',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
        })
      }
    } else {
      results.push({
        step: '4. Verify application appears in admin fetch',
        status: 'skip',
        message: 'Skipped - no test data created',
      })
    }

    // Step 5: Test approve flow
    if (testStoreOwnerId) {
      console.log('[UAT Test] Step 5: Testing approve flow...')
      try {
        const { data: updateData, error: approveError } = await supabaseAdmin
          .from('store_owners')
          .update({
            application_status: 'approved',
            approval_date: new Date().toISOString(),
            accepts_orders: true,
          })
          .eq('id', testStoreOwnerId)
          .select()
          .single()

        if (approveError) {
          results.push({
            step: '5. Test approve flow (store_owner update)',
            status: 'fail',
            message: `Failed to approve: ${approveError.message}`,
            data: { error: approveError }
          })
        } else {
          results.push({
            step: '5. Test approve flow (store_owner update)',
            status: 'pass',
            message: `Approved! New status: ${updateData.application_status}`,
            data: { status: updateData.application_status, acceptsOrders: updateData.accepts_orders }
          })
        }

        // Also activate the bodega store
        if (testBodegaStoreId) {
          const { error: storeActivateError } = await supabaseAdmin
            .from('bodega_stores')
            .update({
              is_active: true,
              verified: true,
            })
            .eq('id', testBodegaStoreId)

          if (storeActivateError) {
            results.push({
              step: '5b. Test approve flow (bodega_store activation)',
              status: 'fail',
              message: `Failed to activate store: ${storeActivateError.message}`,
            })
          } else {
            results.push({
              step: '5b. Test approve flow (bodega_store activation)',
              status: 'pass',
              message: 'Bodega store activated and verified',
            })
          }
        }
      } catch (error) {
        results.push({
          step: '5. Test approve flow',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
        })
      }
    } else {
      results.push({
        step: '5. Test approve flow',
        status: 'skip',
        message: 'Skipped - no test data created',
      })
    }

    // Step 6: Test reject flow (change back to pending first, then reject)
    if (testStoreOwnerId) {
      console.log('[UAT Test] Step 6: Testing reject flow...')
      try {
        // Reset to pending
        await supabaseAdmin
          .from('store_owners')
          .update({ application_status: 'pending' })
          .eq('id', testStoreOwnerId)

        const { data: rejectData, error: rejectError } = await supabaseAdmin
          .from('store_owners')
          .update({
            application_status: 'rejected',
            rejection_reason: 'UAT Test rejection reason',
          })
          .eq('id', testStoreOwnerId)
          .select()
          .single()

        if (rejectError) {
          results.push({
            step: '6. Test reject flow',
            status: 'fail',
            message: `Failed to reject: ${rejectError.message}`,
            data: { error: rejectError }
          })
        } else {
          results.push({
            step: '6. Test reject flow',
            status: 'pass',
            message: `Rejected! Status: ${rejectData.application_status}, Reason: ${rejectData.rejection_reason}`,
            data: { status: rejectData.application_status, reason: rejectData.rejection_reason }
          })
        }
      } catch (error) {
        results.push({
          step: '6. Test reject flow',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
        })
      }
    } else {
      results.push({
        step: '6. Test reject flow',
        status: 'skip',
        message: 'Skipped - no test data created',
      })
    }

    // Step 7: Check email URL configuration
    console.log('[UAT Test] Step 7: Checking email URL configuration...')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const isCorrectUrl = appUrl.includes('julyu.com')
    results.push({
      step: '7. Check email URL configuration',
      status: isCorrectUrl ? 'pass' : 'fail',
      message: isCorrectUrl
        ? `Email URLs correctly point to: ${appUrl}`
        : `INCORRECT: Email URLs point to "${appUrl}" - should be https://julyu.com`,
      data: { currentUrl: appUrl, expected: 'https://julyu.com' }
    })

    // Step 8: Cleanup - Delete test data
    console.log('[UAT Test] Step 8: Cleaning up test data...')
    try {
      if (testBodegaStoreId) {
        await supabaseAdmin
          .from('bodega_stores')
          .delete()
          .eq('id', testBodegaStoreId)
      }

      if (testStoreOwnerId) {
        await supabaseAdmin
          .from('store_owners')
          .delete()
          .eq('id', testStoreOwnerId)
      }

      if (testUserId) {
        await supabaseAdmin.auth.admin.deleteUser(testUserId)
      }

      results.push({
        step: '8. Cleanup test data',
        status: 'pass',
        message: 'All test data cleaned up successfully',
      })
    } catch (cleanupError) {
      results.push({
        step: '8. Cleanup test data',
        status: 'fail',
        message: `Cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown'}`,
      })
    }

  } catch (error) {
    results.push({
      step: 'CRITICAL ERROR',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown critical error',
    })
  }

  // Calculate summary
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length

  console.log('[UAT Test] ====== UAT TEST COMPLETE ======')
  console.log(`[UAT Test] Results: ${passed} passed, ${failed} failed, ${skipped} skipped`)

  return NextResponse.json({
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
      overallStatus: failed > 0 ? 'FAIL' : 'PASS'
    },
    results,
    timestamp: new Date().toISOString(),
  }, {
    status: failed > 0 ? 500 : 200
  })
}
