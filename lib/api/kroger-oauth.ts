/**
 * Kroger OAuth Client for User Authentication
 * Handles OAuth 2.0 authorization code flow for cart operations
 *
 * Flow:
 * 1. User clicks "Connect Kroger Account"
 * 2. Redirect to Kroger login
 * 3. User authorizes app
 * 4. Kroger redirects back with code
 * 5. Exchange code for access + refresh tokens
 * 6. Store encrypted tokens in database
 * 7. Use tokens to add items to cart
 */

import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'

const ALGORITHM = 'aes-256-cbc'

interface KrogerOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface KrogerTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: string
  scope?: string
}

interface KrogerUserToken {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope?: string
}

/**
 * Get Kroger OAuth configuration from environment
 */
function getOAuthConfig(): KrogerOAuthConfig {
  const clientId = process.env.KROGER_CLIENT_ID
  const clientSecret = process.env.KROGER_CLIENT_SECRET
  const redirectUri = process.env.KROGER_REDIRECT_URI || 'http://localhost:3825/api/kroger/callback'

  if (!clientId || !clientSecret) {
    throw new Error('Kroger OAuth credentials not configured')
  }

  return {
    clientId,
    clientSecret,
    redirectUri
  }
}

/**
 * Get encryption key for token storage
 */
function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return key.substring(0, 32).padEnd(32, '0')
}

/**
 * Encrypt a token for secure storage
 */
function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a token from storage
 */
function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  const parts = encryptedToken.split(':')

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted token format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const config = getOAuthConfig()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'cart.basic:write product.compact',
    state: state
  })

  return `https://api.kroger.com/v1/connect/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<KrogerTokenResponse> {
  const config = getOAuthConfig()

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.redirectUri
  })

  const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[KrogerOAuth] Token exchange failed:', error)
    throw new Error(`Failed to exchange code for token: ${response.status}`)
  }

  return await response.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<KrogerTokenResponse> {
  const config = getOAuthConfig()

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[KrogerOAuth] Token refresh failed:', error)
    throw new Error(`Failed to refresh token: ${response.status}`)
  }

  return await response.json()
}

/**
 * Store user's OAuth tokens in database
 */
export async function storeUserToken(userId: string, tokenResponse: KrogerTokenResponse): Promise<void> {
  const supabase = createServerClient()

  const encryptedAccess = encryptToken(tokenResponse.access_token)
  const encryptedRefresh = encryptToken(tokenResponse.refresh_token)
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

  const { error } = await supabase
    .from('kroger_user_tokens')
    .upsert({
      user_id: userId,
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      expires_at: expiresAt.toISOString(),
      scope: tokenResponse.scope,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('[KrogerOAuth] Failed to store token:', error)
    throw new Error('Failed to store OAuth token')
  }

  console.log('[KrogerOAuth] Stored token for user:', userId, 'expires:', expiresAt)
}

/**
 * Get user's OAuth token from database (and refresh if expired)
 */
export async function getUserToken(userId: string): Promise<string | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('kroger_user_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.log('[KrogerOAuth] No token found for user:', userId)
    return null
  }

  const now = new Date()
  const expiresAt = new Date(data.expires_at)

  // Check if token is expired or will expire in next 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('[KrogerOAuth] Token expired or expiring soon, refreshing...')

    try {
      const decryptedRefresh = decryptToken(data.refresh_token_encrypted)
      const newToken = await refreshAccessToken(decryptedRefresh)
      await storeUserToken(userId, newToken)

      return newToken.access_token
    } catch (refreshError) {
      console.error('[KrogerOAuth] Token refresh failed:', refreshError)
      // Delete invalid token
      await supabase
        .from('kroger_user_tokens')
        .delete()
        .eq('user_id', userId)

      return null
    }
  }

  // Token still valid, decrypt and return
  return decryptToken(data.access_token_encrypted)
}

/**
 * Check if user has connected their Kroger account
 */
export async function hasKrogerConnection(userId: string): Promise<boolean> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('kroger_user_tokens')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !error && data !== null
}

/**
 * Disconnect user's Kroger account
 */
export async function disconnectKrogerAccount(userId: string): Promise<void> {
  const supabase = createServerClient()

  await supabase
    .from('kroger_user_tokens')
    .delete()
    .eq('user_id', userId)

  console.log('[KrogerOAuth] Disconnected Kroger account for user:', userId)
}
