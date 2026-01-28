/**
 * Kroger OAuth Callback Endpoint
 * Handles redirect from Kroger after user authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, storeUserToken } from '@/lib/api/kroger-oauth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for errors from Kroger
    if (error) {
      console.error('[KrogerCallback] OAuth error:', error)
      return NextResponse.redirect(
        new URL('/dashboard/compare?kroger_error=access_denied', request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Verify state parameter (CSRF protection)
    const storedState = request.cookies.get('kroger_oauth_state')?.value
    if (!storedState || storedState !== state) {
      console.error('[KrogerCallback] State mismatch - possible CSRF attack')
      return NextResponse.redirect(
        new URL('/dashboard/compare?kroger_error=invalid_state', request.url)
      )
    }

    // Get user ID from cookie
    const userId = request.cookies.get('kroger_oauth_user')?.value
    if (!userId) {
      return NextResponse.json({ error: 'User session expired' }, { status: 401 })
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code)

    // Store tokens in database
    await storeUserToken(userId, tokenResponse)

    // Clear cookies
    const response = NextResponse.redirect(
      new URL('/dashboard/compare?kroger_connected=true', request.url)
    )

    response.cookies.delete('kroger_oauth_state')
    response.cookies.delete('kroger_oauth_user')

    return response
  } catch (error: any) {
    console.error('[KrogerCallback] Error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/compare?kroger_error=connection_failed', request.url)
    )
  }
}
