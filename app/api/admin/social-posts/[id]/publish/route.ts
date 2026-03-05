import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { publishToplatform } from '@/lib/social/publishers'
import type { Platform } from '@/lib/social/types'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const ALGORITHM = 'aes-256-cbc'

function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return key.substring(0, 32).padEnd(32, '0')
}

function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') return ''
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return ''
    const ivHex = parts[0]
    const encryptedHex = parts[1]
    if (!ivHex || ivHex.length !== 32) return ''
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

const PLATFORM_MODEL_NAMES: Record<string, string> = {
  TWITTER: 'twitter-social',
  LINKEDIN: 'linkedin-social',
  FACEBOOK: 'facebook-social',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServiceRoleClient() as any

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status === 'PUBLISHED') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 400 })
    }

    const platform = post.platform as Platform
    const modelName = PLATFORM_MODEL_NAMES[platform]

    if (!modelName) {
      await supabase
        .from('social_media_posts')
        .update({ status: 'FAILED', publish_error: `Publishing to ${platform} is not supported` })
        .eq('id', id)
      return NextResponse.json({ error: `Publishing to ${platform} is not supported` }, { status: 400 })
    }

    // Fetch credentials
    const { data: config } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', modelName)
      .eq('is_active', true)
      .single()

    if (!config?.api_key_encrypted) {
      await supabase
        .from('social_media_posts')
        .update({ status: 'FAILED', publish_error: `No credentials configured for ${platform}` })
        .eq('id', id)
      return NextResponse.json({ error: `No credentials configured for ${platform}` }, { status: 400 })
    }

    const decrypted = decrypt(config.api_key_encrypted)
    if (!decrypted) {
      await supabase
        .from('social_media_posts')
        .update({ status: 'FAILED', publish_error: 'Failed to decrypt credentials' })
        .eq('id', id)
      return NextResponse.json({ error: 'Failed to decrypt credentials' }, { status: 500 })
    }

    let credentials
    try {
      credentials = JSON.parse(decrypted)
    } catch {
      await supabase
        .from('social_media_posts')
        .update({ status: 'FAILED', publish_error: 'Invalid credentials format' })
        .eq('id', id)
      return NextResponse.json({ error: 'Invalid credentials format' }, { status: 500 })
    }

    // Publish
    const result = await publishToplatform(platform, post.content, post.hashtags || [], credentials)

    if (result.success) {
      await supabase
        .from('social_media_posts')
        .update({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
          publish_error: null,
        })
        .eq('id', id)

      return NextResponse.json({ success: true, postId: result.postId })
    } else {
      await supabase
        .from('social_media_posts')
        .update({ status: 'FAILED', publish_error: result.error })
        .eq('id', id)

      return NextResponse.json({ error: result.error || 'Publishing failed' }, { status: 502 })
    }
  } catch (error: any) {
    console.error('[Social Posts] Publish Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
