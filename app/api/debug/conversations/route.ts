import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Diagnostic endpoint to test conversation history pipeline.
 * Hit GET /api/debug/conversations to see what's failing.
 * DELETE THIS FILE after debugging is complete.
 */
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: {} as Record<string, unknown>,
  }

  try {
    // Step 1: Check auth
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    results.steps = {
      '1_auth': {
        supabaseUser: user ? { id: user.id, email: user.email } : null,
        supabaseAuthError: authError?.message || null,
        firebaseUserId: firebaseUserId || null,
        resolvedUserId: userId || null,
        authMethod: user ? 'supabase_cookie' : firebaseUserId ? 'firebase_header' : 'NONE',
      },
    }

    if (!userId) {
      results.error = 'No userId resolved - user is not authenticated'
      return NextResponse.json(results, { status: 401 })
    }

    // Step 2: Check service role client
    let dbClient: ReturnType<typeof createServiceRoleClient>
    try {
      dbClient = createServiceRoleClient()
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      ;(results.steps as Record<string, unknown>)['2_service_role'] = {
        hasServiceRoleKey: hasServiceKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      }
    } catch (e) {
      ;(results.steps as Record<string, unknown>)['2_service_role'] = {
        error: e instanceof Error ? e.message : String(e),
      }
      return NextResponse.json(results, { status: 500 })
    }

    // Step 3: Check if user exists in public.users
    const { data: userRow, error: userError } = await dbClient
      .from('users')
      .select('id, email, full_name, subscription_tier')
      .eq('id', userId)
      .single()

    ;(results.steps as Record<string, unknown>)['3_user_exists'] = {
      found: !!userRow,
      user: userRow ? { id: userRow.id, email: userRow.email, full_name: userRow.full_name } : null,
      error: userError ? { code: userError.code, message: userError.message } : null,
    }

    // Step 4: Try to list existing conversations
    const { data: existingConvs, error: listError } = await dbClient
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5)

    ;(results.steps as Record<string, unknown>)['4_list_conversations'] = {
      count: existingConvs?.length ?? 0,
      conversations: existingConvs || [],
      error: listError ? { code: listError.code, message: listError.message } : null,
    }

    // Step 5: Try to INSERT a test conversation
    const testTitle = `__DEBUG_TEST_${Date.now()}`
    const { data: insertedConv, error: insertError } = await dbClient
      .from('ai_conversations')
      .insert({ user_id: userId, title: testTitle })
      .select('id, title')
      .single()

    ;(results.steps as Record<string, unknown>)['5_insert_test'] = {
      success: !!insertedConv,
      conversation: insertedConv || null,
      error: insertError ? { code: insertError.code, message: insertError.message, details: insertError.details, hint: insertError.hint } : null,
    }

    // Step 6: Read it back
    if (insertedConv) {
      const { data: readBack, error: readError } = await dbClient
        .from('ai_conversations')
        .select('*')
        .eq('id', insertedConv.id)
        .single()

      ;(results.steps as Record<string, unknown>)['6_read_back'] = {
        success: !!readBack,
        conversation: readBack || null,
        error: readError ? { code: readError.code, message: readError.message } : null,
      }

      // Step 7: Try inserting a test message
      const { data: insertedMsg, error: msgError } = await dbClient
        .from('ai_messages')
        .insert({
          conversation_id: insertedConv.id,
          role: 'user',
          content: 'Debug test message',
        })
        .select('id')
        .single()

      ;(results.steps as Record<string, unknown>)['7_insert_message'] = {
        success: !!insertedMsg,
        error: msgError ? { code: msgError.code, message: msgError.message, details: msgError.details } : null,
      }

      // Cleanup: delete the test conversation (cascades to messages)
      await dbClient
        .from('ai_conversations')
        .delete()
        .eq('id', insertedConv.id)

      ;(results.steps as Record<string, unknown>)['8_cleanup'] = { done: true }
    }

    results.summary = {
      authWorks: !!userId,
      serviceRoleWorks: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      userExists: !!userRow,
      canListConversations: !listError,
      canInsertConversation: !!insertedConv,
      existingConversationCount: existingConvs?.length ?? 0,
      verdict: !userId ? 'AUTH_FAILED'
        : !userRow ? 'USER_NOT_IN_DB'
        : insertError ? 'INSERT_BLOCKED'
        : 'ALL_WORKING',
    }

    return NextResponse.json(results)
  } catch (error) {
    results.fatalError = error instanceof Error ? error.message : String(error)
    return NextResponse.json(results, { status: 500 })
  }
}
