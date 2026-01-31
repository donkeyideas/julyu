import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  // Check 1: Environment variables
  const envChecks = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET (will default to localhost)',
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
  }
  results.checks.environment = {
    status: envChecks.SUPABASE_SERVICE_ROLE_KEY ? 'pass' : 'fail',
    details: envChecks
  }

  // Check 2: Service role client creation
  try {
    const supabaseAdmin = createServiceRoleClient()
    results.checks.serviceRoleClient = {
      status: 'pass',
      message: 'Service role client created successfully'
    }

    // Check 3: Database read (count store_owners)
    try {
      const { data, error, count } = await (supabaseAdmin as any)
        .from('store_owners')
        .select('id', { count: 'exact', head: true })

      if (error) {
        results.checks.databaseRead = {
          status: 'fail',
          error: error.message,
          code: error.code
        }
      } else {
        results.checks.databaseRead = {
          status: 'pass',
          message: `Connected to database. store_owners count: ${count ?? 'unknown'}`
        }
      }
    } catch (dbError) {
      results.checks.databaseRead = {
        status: 'fail',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }

    // Check 4: Database write test (insert then delete)
    try {
      const testId = `health-check-${Date.now()}`

      // Try to insert a test record
      const { data: insertData, error: insertError } = await (supabaseAdmin as any)
        .from('store_owners')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          business_name: `Health Check Test ${testId}`,
          business_type: 'bodega',
          business_address: 'Test Address',
          business_phone: '000-000-0000',
          business_email: `healthcheck-${testId}@test.local`,
          application_status: 'pending',
          commission_rate: 15.00,
          accepts_orders: false,
        })
        .select('id')
        .single()

      if (insertError) {
        // Check if it's a foreign key error (user_id doesn't exist)
        if (insertError.code === '23503') {
          results.checks.databaseWrite = {
            status: 'pass',
            message: 'Write test blocked by FK constraint (expected - user_id does not exist). Database writes are working.'
          }
        } else {
          results.checks.databaseWrite = {
            status: 'fail',
            error: insertError.message,
            code: insertError.code
          }
        }
      } else {
        // Clean up - delete the test record
        await (supabaseAdmin as any)
          .from('store_owners')
          .delete()
          .eq('id', insertData.id)

        results.checks.databaseWrite = {
          status: 'pass',
          message: 'Successfully inserted and deleted test record'
        }
      }
    } catch (writeError) {
      results.checks.databaseWrite = {
        status: 'fail',
        error: writeError instanceof Error ? writeError.message : 'Unknown write error'
      }
    }

  } catch (clientError) {
    results.checks.serviceRoleClient = {
      status: 'fail',
      error: clientError instanceof Error ? clientError.message : 'Failed to create service role client'
    }
  }

  // Check 5: Email URL configuration
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const isProductionUrl = appUrl.includes('julyu.com')
  results.checks.emailUrls = {
    status: isProductionUrl ? 'pass' : 'warn',
    currentUrl: appUrl,
    message: isProductionUrl
      ? 'Email URLs correctly configured for julyu.com'
      : `WARNING: Email URLs will use "${appUrl}" - set NEXT_PUBLIC_APP_URL=https://julyu.com in Vercel and redeploy`
  }

  // Overall status
  const allChecks = Object.values(results.checks) as Array<{ status: string }>
  const hasFailure = allChecks.some(c => c.status === 'fail')
  const hasWarning = allChecks.some(c => c.status === 'warn')

  results.overallStatus = hasFailure ? 'FAIL' : hasWarning ? 'WARN' : 'PASS'

  return NextResponse.json(results, {
    status: hasFailure ? 500 : 200
  })
}
