import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.com/signed' }, error: null }),
      })),
    },
  })),
}))

// Mock DeepSeek client
vi.mock('@/lib/api/deepseek', () => ({
  deepseekClient: {
    matchProducts: vi.fn().mockResolvedValue([
      {
        userInput: 'Milk 2%',
        matchedProduct: 'Whole Milk 2%',
        brand: 'Great Value',
        size: '1 gallon',
        confidence: 0.95,
      },
    ]),
  },
}))

// Mock OpenAI client
vi.mock('@/lib/api/openai', () => ({
  openaiClient: {
    scanReceipt: vi.fn().mockResolvedValue({
      store: { name: 'Walmart', address: '123 Main St' },
      items: [
        { name: 'Milk 2%', price: 3.99, quantity: 1 },
        { name: 'Bread', price: 2.49, quantity: 1 },
      ],
      total: 6.48,
      tax: 0.52,
      purchaseDate: '2025-01-25T10:30:00Z',
      confidence: 0.92,
    }),
  },
}))

// Mock AI tracker
vi.mock('@/lib/ai/tracker', () => ({
  aiTracker: {
    trackUsage: vi.fn().mockResolvedValue(undefined),
    storeTrainingData: vi.fn().mockResolvedValue(undefined),
    calculateCost: vi.fn().mockReturnValue(0.001),
  },
}))

// Global test utilities
export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
})
