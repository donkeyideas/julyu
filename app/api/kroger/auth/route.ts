/**
 * Kroger OAuth Authorization Endpoint
 * Initiates OAuth flow by redirecting user to Kroger login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/api/kroger-oauth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    // Store state in session/cookie for validation on callback
    const response = NextResponse.redirect(getAuthorizationUrl(state))

    // Set state cookie (httpOnly for security)
    response.cookies.set('kroger_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    // Store user ID for callback
    response.cookies.set('kroger_oauth_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error: any) {
    console.error('[KrogerAuth] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
