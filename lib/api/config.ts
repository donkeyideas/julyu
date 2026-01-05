/**
 * API Configuration Manager
 * Retrieves API keys from database or environment variables
 */

import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getEncryptionKey(): string {
  const key = process.env.API_KEY_ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!'
  // Ensure it's exactly 32 bytes
  return key.substring(0, 32).padEnd(32, '0')
}

function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      console.error('[Config] Invalid encrypted text type:', typeof encryptedText)
      return ''
    }

    const key = getEncryptionKey()
    const parts = encryptedText.split(':')
    
    if (parts.length !== 2) {
      console.error('[Config] Invalid encrypted format - parts:', parts.length)
      console.error('[Config] Encrypted text preview:', encryptedText.substring(0, 50))
      return ''
    }
    
    const ivHex = parts[0]
    const encryptedHex = parts[1]
    
    if (!ivHex || ivHex.length !== 32) {
      console.error('[Config] Invalid IV length:', ivHex.length)
      return ''
    }
    
    const iv = Buffer.from(ivHex, 'hex')
    if (iv.length !== 16) {
      console.error('[Config] Invalid IV buffer length:', iv.length)
      return ''
    }
    
    const encrypted = encryptedHex
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    // Log decrypted key length (for debugging, not the actual key)
    console.log('[Config] Decrypted key length:', decrypted.length)
    console.log('[Config] Decrypted key starts with:', decrypted.substring(0, 10))
    
    return decrypted
  } catch (error: any) {
    console.error('[Config] Decryption error:', error.message)
    console.error('[Config] Decryption error stack:', error.stack)
    return ''
  }
}

/**
 * Get API key from database or environment variable
 */
export async function getApiKey(modelName: string): Promise<string | null> {
  try {
    // First try database (user-configured keys)
    try {
      const supabase = createServerClient()
      const { data: config, error: configError } = await supabase
        .from('ai_model_config')
        .select('api_key_encrypted, is_active')
        .eq('model_name', modelName)
        .eq('is_active', true)
        .single()

      if (!configError && config?.api_key_encrypted) {
        console.log('[Config] Found encrypted key in database, decrypting...')
        console.log('[Config] Encrypted key length:', config.api_key_encrypted.length)
        console.log('[Config] Encrypted key preview:', config.api_key_encrypted.substring(0, 50))
        
        const decrypted = decrypt(config.api_key_encrypted)
        console.log('[Config] Decrypted raw result length:', decrypted?.length || 0)
        console.log('[Config] Decrypted raw preview:', decrypted?.substring(0, 50) || 'null')
        
        if (decrypted && decrypted.trim() !== '') {
          let trimmed = decrypted.trim()
          console.log('[Config] After trim, length:', trimmed.length, 'preview:', trimmed.substring(0, 50))
          
          // Remove "Julyu " prefix if present (some keys were saved with this prefix)
          if (trimmed.toLowerCase().startsWith('julyu ')) {
            trimmed = trimmed.substring(6).trim()
            console.log('[Config] Removed "Julyu " prefix from decrypted key')
          }
          
          // Check if decryption produced garbage - if it doesn't start with expected format, it's corrupted
          if (modelName.includes('deepseek') && !trimmed.startsWith('sk-')) {
            console.error('[Config] ERROR: Decryption produced invalid key!')
            console.error('[Config] Key preview (first 50 chars):', trimmed.substring(0, 50))
            console.error('[Config] Key preview (last 50 chars):', trimmed.substring(Math.max(0, trimmed.length - 50)))
            console.error('[Config] Key char codes (first 10):', Array.from(trimmed.substring(0, 10)).map(c => c.charCodeAt(0)))
            
            // Don't return corrupted key - fall through to environment variable
            console.warn('[Config] Skipping corrupted decrypted key, will use environment variable')
          } else {
            console.log('[Config] Final key length:', trimmed.length)
            console.log('[Config] Final key starts with:', trimmed.substring(0, 10))
            console.log('[Config] Final key ends with:', trimmed.substring(Math.max(0, trimmed.length - 10)))
            return trimmed
          }
        } else {
          console.error('[Config] ERROR: Decrypted key is empty or invalid')
          console.error('[Config] Encrypted length:', config.api_key_encrypted.length)
          console.error('[Config] Decrypted value:', decrypted)
        }
      } else {
        console.log('[Config] No encrypted key found in database for', modelName)
        if (configError) {
          console.error('[Config] Database error:', configError)
        }
      }
    } catch (dbError: any) {
      // If database query fails (table doesn't exist, etc.), fallback to environment
      console.warn(`Database query failed for ${modelName}, using environment variables:`, dbError.message)
    }

    // Fallback to environment variables
    if (modelName === 'deepseek-chat' || modelName.includes('deepseek')) {
      const envKey = process.env.DEEPSEEK_API_KEY
      if (envKey && envKey.trim() !== '') {
        return envKey
      }
    }
    
    if (modelName === 'gpt-4-vision' || modelName.includes('openai') || modelName.includes('gpt')) {
      const envKey = process.env.OPENAI_API_KEY
      if (envKey && envKey.trim() !== '') {
        return envKey
      }
    }

    return null
  } catch (error: any) {
    console.error(`Error getting API key for ${modelName}:`, error)
    
    // Final fallback to environment variables
    if (modelName === 'deepseek-chat' || modelName.includes('deepseek')) {
      return process.env.DEEPSEEK_API_KEY || null
    }
    
    if (modelName === 'gpt-4-vision' || modelName.includes('openai') || modelName.includes('gpt')) {
      return process.env.OPENAI_API_KEY || null
    }

    return null
  }
}

