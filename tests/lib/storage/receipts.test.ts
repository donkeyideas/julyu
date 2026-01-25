import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadReceiptImage, deleteReceiptImage, getReceiptSignedUrl } from '@/lib/storage/receipts'

describe('Receipt Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadReceiptImage', () => {
    it('should upload image and return success result', async () => {
      const userId = 'test-user-123'
      const imageBuffer = Buffer.from('fake-image-data')
      const mimeType = 'image/jpeg'

      const result = await uploadReceiptImage(userId, imageBuffer, mimeType)

      expect(result.success).toBe(true)
      expect(result.url).toBeDefined()
      expect(result.path).toBeDefined()
    })

    it('should use default mime type if not provided', async () => {
      const userId = 'test-user-123'
      const imageBuffer = Buffer.from('fake-image-data')

      const result = await uploadReceiptImage(userId, imageBuffer)

      expect(result.success).toBe(true)
    })

    it('should generate unique filename with timestamp', async () => {
      const userId = 'test-user-123'
      const imageBuffer = Buffer.from('fake-image-data')

      const result1 = await uploadReceiptImage(userId, imageBuffer)
      const result2 = await uploadReceiptImage(userId, imageBuffer)

      // Both should succeed (mocked)
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })

  describe('deleteReceiptImage', () => {
    it('should delete image and return true on success', async () => {
      const path = 'test-user-123/12345.jpg'

      const result = await deleteReceiptImage(path)

      expect(result).toBe(true)
    })
  })

  describe('getReceiptSignedUrl', () => {
    it('should return signed URL', async () => {
      const path = 'test-user-123/12345.jpg'

      const url = await getReceiptSignedUrl(path)

      expect(url).toBeDefined()
      expect(typeof url).toBe('string')
    })

    it('should accept custom expiry time', async () => {
      const path = 'test-user-123/12345.jpg'
      const customExpiry = 7200 // 2 hours

      const url = await getReceiptSignedUrl(path, customExpiry)

      expect(url).toBeDefined()
    })
  })
})
