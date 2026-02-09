import { createServiceRoleClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'blog-images'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export async function uploadBlogImage(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    const supabase = createServiceRoleClient()

    const timestamp = Date.now()
    const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const fileName = `${timestamp}.${extension}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (error) {
      console.error('[BlogImageStorage] Upload error:', error)
      return { success: false, error: error.message }
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error('[BlogImageStorage] Unexpected error:', error)
    return { success: false, error: error.message || 'Failed to upload image' }
  }
}
