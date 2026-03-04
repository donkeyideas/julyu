import type {
  Platform,
  PublishResult,
  TwitterCredentials,
  LinkedInCredentials,
  FacebookCredentials,
} from './types'

/**
 * Append hashtags to content, deduplicating any already present
 */
export function appendHashtags(content: string, hashtags: string[]): string {
  if (!hashtags || hashtags.length === 0) return content

  const existing = new Set(
    (content.match(/#[\w]+/g) || []).map((h) => h.toLowerCase())
  )
  const newTags = hashtags
    .map((h) => (h.startsWith('#') ? h : `#${h}`))
    .filter((h) => !existing.has(h.toLowerCase()))

  if (newTags.length === 0) return content
  return `${content}\n\n${newTags.join(' ')}`
}

/**
 * Publish a post to Twitter/X using OAuth 1.0a
 */
export async function publishToTwitter(
  content: string,
  credentials: TwitterCredentials
): Promise<PublishResult> {
  try {
    const { TwitterApi } = await import('twitter-api-v2')
    const client = new TwitterApi({
      appKey: credentials.api_key,
      appSecret: credentials.api_secret,
      accessToken: credentials.access_token,
      accessSecret: credentials.access_token_secret,
    })

    // Auto-truncate to 280 chars
    const truncated = content.length > 280 ? content.substring(0, 277) + '...' : content
    const result = await client.v2.tweet(truncated)

    return { success: true, postId: result.data.id }
  } catch (error: any) {
    console.error('[Social Media] Twitter publish error:', error)
    return { success: false, error: error.message || 'Failed to publish to Twitter' }
  }
}

/**
 * Publish a post to LinkedIn using REST v2 Posts API
 */
export async function publishToLinkedIn(
  content: string,
  credentials: LinkedInCredentials
): Promise<PublishResult> {
  try {
    const response = await fetch('https://api.linkedin.com/v2/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: credentials.person_urn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `LinkedIn API error: ${response.status}`)
    }

    const postId = response.headers.get('x-restli-id') || 'unknown'
    return { success: true, postId }
  } catch (error: any) {
    console.error('[Social Media] LinkedIn publish error:', error)
    return { success: false, error: error.message || 'Failed to publish to LinkedIn' }
  }
}

/**
 * Publish a post to Facebook using Graph API v19.0
 */
export async function publishToFacebook(
  content: string,
  credentials: FacebookCredentials
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${credentials.page_id}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: credentials.page_access_token,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, postId: data.id }
  } catch (error: any) {
    console.error('[Social Media] Facebook publish error:', error)
    return { success: false, error: error.message || 'Failed to publish to Facebook' }
  }
}

/**
 * Publish to a platform by name
 */
export async function publishToplatform(
  platform: Platform,
  content: string,
  hashtags: string[],
  credentials: any
): Promise<PublishResult> {
  const fullContent = appendHashtags(content, hashtags)

  switch (platform) {
    case 'TWITTER':
      return publishToTwitter(fullContent, credentials)
    case 'LINKEDIN':
      return publishToLinkedIn(fullContent, credentials)
    case 'FACEBOOK':
      return publishToFacebook(fullContent, credentials)
    case 'INSTAGRAM':
      return { success: false, error: 'Instagram text-only posts are not supported via API' }
    case 'TIKTOK':
      return { success: false, error: 'TikTok publishing is not yet implemented' }
    default:
      return { success: false, error: `Unknown platform: ${platform}` }
  }
}

/**
 * Test connection to a platform by making a lightweight API call
 */
export async function testConnection(
  platform: Platform,
  credentials: any
): Promise<{ success: boolean; username?: string; error?: string }> {
  switch (platform) {
    case 'TWITTER': {
      try {
        const { TwitterApi } = await import('twitter-api-v2')
        const client = new TwitterApi({
          appKey: credentials.api_key,
          appSecret: credentials.api_secret,
          accessToken: credentials.access_token,
          accessSecret: credentials.access_token_secret,
        })
        const me = await client.v2.me()
        return { success: true, username: `@${me.data.username}` }
      } catch (error: any) {
        return { success: false, error: error.message || 'Twitter connection failed' }
      }
    }
    case 'LINKEDIN': {
      try {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${credentials.access_token}` },
        })
        if (!response.ok) throw new Error(`LinkedIn API error: ${response.status}`)
        const data = await response.json()
        return { success: true, username: data.name || data.email || 'Connected' }
      } catch (error: any) {
        return { success: false, error: error.message || 'LinkedIn connection failed' }
      }
    }
    case 'FACEBOOK': {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/me?access_token=${credentials.page_access_token}`
        )
        if (!response.ok) throw new Error(`Facebook API error: ${response.status}`)
        const data = await response.json()
        return { success: true, username: data.name || 'Connected' }
      } catch (error: any) {
        return { success: false, error: error.message || 'Facebook connection failed' }
      }
    }
    case 'INSTAGRAM':
      return { success: false, error: 'Instagram API connection testing not supported' }
    case 'TIKTOK':
      return { success: false, error: 'TikTok API connection testing not yet implemented' }
    default:
      return { success: false, error: `Unknown platform: ${platform}` }
  }
}
