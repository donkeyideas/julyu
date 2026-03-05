import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/social/publishers'
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
    const iv = Buffer.from(parts[0], 'hex')
    if (iv.length !== 16) return ''
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)
    let decrypted = decipher.update(parts[1], 'hex', 'utf8')
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

export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json()

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    const modelName = PLATFORM_MODEL_NAMES[platform]
    if (!modelName) {
      return NextResponse.json({
        success: false,
        error: `Connection testing not supported for ${platform}`,
      })
    }

    const supabase = await createServiceRoleClient() as any
    const { data: config } = await supabase
      .from('ai_model_config')
      .select('api_key_encrypted')
      .eq('model_name', modelName)
      .eq('is_active', true)
      .single()

    if (!config?.api_key_encrypted) {
      return NextResponse.json({
        success: false,
        error: `No credentials configured for ${platform}`,
      })
    }

    const decrypted = decrypt(config.api_key_encrypted)
    if (!decrypted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt credentials',
      })
    }

    let credentials
    try {
      credentials = JSON.parse(decrypted)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials format',
      })
    }

    const result = await testConnection(platform as Platform, credentials)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Social Posts] Test Connection Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
