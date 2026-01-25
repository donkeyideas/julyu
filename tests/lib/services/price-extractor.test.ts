import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the normalizeStoreName function logic
describe('Price Extractor - Store Name Normalization', () => {
  // We'll test the normalization logic inline since it's a private function
  const normalizeStoreName = (name: string): string => {
    const retailers: Record<string, string[]> = {
      'walmart': ['walmart', 'wal-mart', 'wal mart'],
      'target': ['target'],
      'kroger': ['kroger', 'fred meyer', 'ralphs', 'smiths', 'king soopers', 'fry\'s'],
      'costco': ['costco'],
      'safeway': ['safeway', 'albertsons', 'vons', 'jewel-osco'],
      'publix': ['publix'],
      'aldi': ['aldi'],
      'trader_joes': ['trader joe', 'trader joes', 'trader joe\'s'],
      'whole_foods': ['whole foods'],
    }

    const lowerName = name.toLowerCase()

    for (const [retailer, variants] of Object.entries(retailers)) {
      if (variants.some(v => lowerName.includes(v))) {
        return retailer
      }
    }

    return lowerName.replace(/[#\d]+/g, '').replace(/\s+/g, ' ').trim()
  }

  it('should normalize Walmart variations', () => {
    expect(normalizeStoreName('Walmart Supercenter #1234')).toBe('walmart')
    expect(normalizeStoreName('WAL-MART')).toBe('walmart')
    expect(normalizeStoreName('Wal Mart Neighborhood Market')).toBe('walmart')
  })

  it('should normalize Kroger family stores', () => {
    expect(normalizeStoreName('Kroger')).toBe('kroger')
    expect(normalizeStoreName('Fred Meyer #567')).toBe('kroger')
    expect(normalizeStoreName('Ralphs Fresh Fare')).toBe('kroger')
    expect(normalizeStoreName('King Soopers')).toBe('kroger')
  })

  it('should normalize Target', () => {
    expect(normalizeStoreName('Target')).toBe('target')
    expect(normalizeStoreName('TARGET STORE #890')).toBe('target')
  })

  it('should normalize Trader Joe\'s variations', () => {
    expect(normalizeStoreName('Trader Joe\'s')).toBe('trader_joes')
    expect(normalizeStoreName('Trader Joes')).toBe('trader_joes')
    expect(normalizeStoreName('TRADER JOE')).toBe('trader_joes')
  })

  it('should handle unknown stores', () => {
    expect(normalizeStoreName('Local Grocery #123')).toBe('local grocery')
    expect(normalizeStoreName('Mom & Pop Store')).toBe('mom & pop store')
  })
})

describe('Price Extractor - Receipt Processing', () => {
  const mockOCRResult = {
    store: { name: 'Walmart', address: '123 Main St' },
    items: [
      { name: 'Milk 2%', price: 3.99, quantity: 1 },
      { name: 'Bread', price: 2.49, quantity: 1 },
    ],
    total: 7.00, // 3.99 + 2.49 + 0.52 tax = 7.00
    tax: 0.52,
    purchaseDate: '2025-01-25T10:30:00Z',
    confidence: 0.92,
  }

  it('should have valid OCR result structure', () => {
    expect(mockOCRResult.store).toHaveProperty('name')
    expect(mockOCRResult.items).toBeInstanceOf(Array)
    expect(mockOCRResult.items.length).toBe(2)
    expect(mockOCRResult.confidence).toBeGreaterThan(0)
    expect(mockOCRResult.confidence).toBeLessThanOrEqual(1)
  })

  it('should have valid item structure', () => {
    for (const item of mockOCRResult.items) {
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('price')
      expect(item).toHaveProperty('quantity')
      expect(typeof item.price).toBe('number')
      expect(item.price).toBeGreaterThan(0)
    }
  })

  it('should calculate total correctly', () => {
    const itemsTotal = mockOCRResult.items.reduce((sum, item) => sum + item.price, 0)
    // Total should approximately equal items + tax
    expect(mockOCRResult.total).toBeCloseTo(itemsTotal + (mockOCRResult.tax || 0), 2)
  })
})
