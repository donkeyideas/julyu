export type Platform = 'TWITTER' | 'LINKEDIN' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'
export type Tone = 'informative' | 'engaging' | 'promotional' | 'controversial'

export interface SocialMediaPost {
  id: string
  platform: Platform
  content: string
  status: PostStatus
  hashtags: string[]
  image_prompt: string | null
  topic: string | null
  tone: string | null
  scheduled_at: string | null
  published_at: string | null
  publish_error: string | null
  created_at: string
  updated_at: string
}

export interface AutomationConfig {
  enabled: boolean
  platforms: Platform[]
  hour: number
  topics: string[]
  use_domain_content: boolean
  require_approval: boolean
}

export interface PublishResult {
  success: boolean
  postId?: string
  error?: string
}

export interface TwitterCredentials {
  api_key: string
  api_secret: string
  access_token: string
  access_token_secret: string
}

export interface LinkedInCredentials {
  access_token: string
  person_urn: string
}

export interface FacebookCredentials {
  page_access_token: string
  page_id: string
}

export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  TWITTER: 280,
  TIKTOK: 300,
  FACEBOOK: 2000,
  INSTAGRAM: 2200,
  LINKEDIN: 3000,
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  TWITTER: 'Twitter / X',
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
}
