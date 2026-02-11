import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionResult = await validateSession(sessionToken)
    if (!sessionResult.valid || !sessionResult.employee) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient() as any
    const results: Record<string, any> = {}

    // 1. Check if ai_model_usage table exists and count rows
    const { data: usageRows, error: usageError } = await supabase
      .from('ai_model_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    results.ai_model_usage = {
      exists: !usageError || usageError.code !== '42P01',
      error: usageError ? { message: usageError.message, code: usageError.code, hint: usageError.hint } : null,
      rowCount: usageRows?.length || 0,
      sampleRows: (usageRows || []).map((r: any) => ({
        id: r.id,
        model_name: r.model_name,
        provider: r.provider,
        use_case: r.use_case,
        tokens: (r.input_tokens || 0) + (r.output_tokens || 0),
        cost: r.cost,
        success: r.success,
        created_at: r.created_at,
      })),
    }

    // 2. Try a test insert with provider column
    const testRecord = {
      model_name: 'test-diagnostic',
      provider: 'test',
      use_case: 'diagnostic_check',
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      response_time_ms: 0,
      cost: 0,
      success: true,
    }
    const { data: insertData, error: insertError } = await supabase
      .from('ai_model_usage')
      .insert(testRecord)
      .select()

    results.testInsertWithProvider = {
      success: !insertError,
      error: insertError ? { message: insertError.message, code: insertError.code } : null,
      insertedRow: insertData?.[0] ? { id: insertData[0].id, columns: Object.keys(insertData[0]) } : null,
    }

    // 3. If insert with provider failed, try without provider
    if (insertError) {
      const { provider, ...recordWithoutProvider } = testRecord
      const { data: insertData2, error: insertError2 } = await supabase
        .from('ai_model_usage')
        .insert(recordWithoutProvider)
        .select()

      results.testInsertWithoutProvider = {
        success: !insertError2,
        error: insertError2 ? { message: insertError2.message, code: insertError2.code } : null,
        insertedRow: insertData2?.[0] ? { id: insertData2[0].id, columns: Object.keys(insertData2[0]) } : null,
      }
    }

    // 4. Clean up test records
    await supabase
      .from('ai_model_usage')
      .delete()
      .eq('use_case', 'diagnostic_check')

    // 5. Check api_call_logs table
    const { data: apiRows, error: apiError } = await supabase
      .from('api_call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    results.api_call_logs = {
      exists: !apiError || apiError.code !== '42P01',
      error: apiError ? { message: apiError.message, code: apiError.code } : null,
      rowCount: apiRows?.length || 0,
    }

    // 6. Check ai_model_config table
    const { data: configRows, error: configError } = await supabase
      .from('ai_model_config')
      .select('model_name, is_active')
      .limit(10)

    results.ai_model_config = {
      exists: !configError || configError.code !== '42P01',
      error: configError ? { message: configError.message, code: configError.code } : null,
      rows: configRows || [],
    }

    // 7. Get total count of ai_model_usage
    const { count, error: countError } = await supabase
      .from('ai_model_usage')
      .select('*', { count: 'exact', head: true })

    results.totalUsageCount = {
      count: count || 0,
      error: countError ? countError.message : null,
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
