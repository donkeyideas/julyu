import { createServerClient } from '@/lib/supabase/server'

/**
 * Receipt Storage Service
 * Handles uploading and retrieving receipt images from Supabase Storage
 */

const BUCKET_NAME = 'receipts'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload a receipt image to Supabase Storage
 */
export async function uploadReceiptImage(
  userId: string,
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    const supabase = createServerClient()

    // Generate unique filename
    const timestamp = Date.now()
    const extension = mimeType.split('/')[1] || 'jpg'
    const fileName = `${userId}/${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      console.error('[ReceiptStorage] Upload error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error('[ReceiptStorage] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload receipt',
    }
  }
}

/**
 * Delete a receipt image from storage
 */
export async function deleteReceiptImage(path: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('[ReceiptStorage] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[ReceiptStorage] Delete failed:', error)
    return false
  }
}

/**
 * Get a signed URL for a private receipt (if bucket is private)
 */
export async function getReceiptSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[ReceiptStorage] Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('[ReceiptStorage] Signed URL failed:', error)
    return null
  }
}
