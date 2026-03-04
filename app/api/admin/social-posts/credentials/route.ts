import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/admin-auth-v2'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const ALGORITHM = 'aes-256-cbc'

function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  return key.substring(0, 32).padEnd(32, '0')
}

function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
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

// GET - Check which platforms have credentials configured
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
    const { data: configs } = await supabase
      .from('ai_model_config')
      .select('model_name, api_key_encrypted, is_active')
      .in('model_name', Object.values(PLATFORM_MODEL_NAMES))

    const status: Record<string, boolean> = {
      TWITTER: false,
      LINKEDIN: false,
      FACEBOOK: false,
      INSTAGRAM: false,
      TIKTOK: false,
    }

    if (configs) {
      for (const config of configs) {
        const platform = Object.entries(PLATFORM_MODEL_NAMES).find(
          ([, v]) => v === config.model_name
        )?.[0]
        if (platform && config.api_key_encrypted && config.is_active) {
          status[platform] = true
        }
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error('[Social Posts] Credentials GET Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST - Save platform credentials
export async function POST(request: NextRequest) {
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

    const { platform, credentials } = await request.json()

    if (!platform || !credentials) {
      return NextResponse.json({ error: 'Platform and credentials are required' }, { status: 400 })
    }

    const modelName = PLATFORM_MODEL_NAMES[platform]
    if (!modelName) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 })
    }

    // Validate required fields per platform
    if (platform === 'TWITTER') {
      if (!credentials.api_key || !credentials.api_secret || !credentials.access_token || !credentials.access_token_secret) {
        return NextResponse.json({ error: 'All 4 Twitter credentials are required' }, { status: 400 })
      }
    } else if (platform === 'LINKEDIN') {
      if (!credentials.access_token || !credentials.person_urn) {
        return NextResponse.json({ error: 'Access token and Person URN are required for LinkedIn' }, { status: 400 })
      }
    } else if (platform === 'FACEBOOK') {
      if (!credentials.page_access_token || !credentials.page_id) {
        return NextResponse.json({ error: 'Page access token and Page ID are required for Facebook' }, { status: 400 })
      }
    }

    // Encrypt credentials as JSON
    const encryptedKey = encrypt(JSON.stringify(credentials))

    const supabase = await createServiceRoleClient() as any
    const { error } = await supabase
      .from('ai_model_config')
      .upsert(
        {
          model_name: modelName,
          provider: platform,
          api_key_encrypted: encryptedKey,
          is_active: true,
          config: {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'model_name' }
      )

    if (error) {
      console.error('[Social Posts] Credentials save error:', error)
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `${platform} credentials saved` })
  } catch (error: any) {
    console.error('[Social Posts] Credentials POST Error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
