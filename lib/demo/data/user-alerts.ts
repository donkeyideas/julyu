// Mock price alert data for demo users
// All dates are relative to now so data always looks fresh

export interface PriceAlert {
  id: string
  product_name: string
  target_price: number
  current_price: number
  store_name: string
  status: 'triggered' | 'watching'
  created_at: string
  triggered_at: string | null
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function hoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

export const DEMO_ALERTS: PriceAlert[] = [
  {
    id: 'alert-001',
    product_name: 'Large Eggs (dozen)',
    target_price: 2.99,
    current_price: 2.78,
    store_name: 'ALDI',
    status: 'triggered',
    created_at: daysAgo(14),
    triggered_at: hoursAgo(6),
  },
  {
    id: 'alert-002',
    product_name: 'Chicken Breast (1 lb)',
    target_price: 3.99,
    current_price: 3.49,
    store_name: 'Kroger',
    status: 'triggered',
    created_at: daysAgo(10),
    triggered_at: daysAgo(1),
  },
  {
    id: 'alert-003',
    product_name: 'Whole Milk (1 gal)',
    target_price: 3.00,
    current_price: 3.29,
    store_name: 'Walmart',
    status: 'watching',
    created_at: daysAgo(7),
    triggered_at: null,
  },
  {
    id: 'alert-004',
    product_name: 'Salmon Fillet (1 lb)',
    target_price: 7.99,
    current_price: 9.49,
    store_name: 'Publix',
    status: 'watching',
    created_at: daysAgo(5),
    triggered_at: null,
  },
  {
    id: 'alert-005',
    product_name: 'Avocados (each)',
    target_price: 0.79,
    current_price: 0.69,
    store_name: 'ALDI',
    status: 'triggered',
    created_at: daysAgo(12),
    triggered_at: daysAgo(2),
  },
  {
    id: 'alert-006',
    product_name: 'Greek Yogurt (32 oz)',
    target_price: 4.50,
    current_price: 5.29,
    store_name: 'Target',
    status: 'watching',
    created_at: daysAgo(3),
    triggered_at: null,
  },
]
