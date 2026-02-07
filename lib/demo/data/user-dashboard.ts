// Mock dashboard data for demo users
// All dates are relative to now so data always looks fresh

export interface DashboardStats {
  total_savings: number
  comparisons_run: number
  receipts_scanned: number
  avg_savings_per_trip: number
}

export interface MonthlySavings {
  month: string
  total_saved: number
  total_spent: number
  trips_count: number
}

export interface ComparisonItem {
  name: string
  your_price: number
  best_price: number
  savings: number
}

export interface RecentComparison {
  id: string
  created_at: string
  items_count: number
  total_savings: number
  best_store: string
  items: ComparisonItem[]
}

// Helper to get a date relative to now
function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function monthsAgo(months: number): { name: string; date: Date } {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  const name = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return { name, date: d }
}

export const DEMO_DASHBOARD_STATS: DashboardStats = {
  total_savings: 847.32,
  comparisons_run: 156,
  receipts_scanned: 89,
  avg_savings_per_trip: 5.43,
}

export const DEMO_MONTHLY_SAVINGS: MonthlySavings[] = [
  { month: monthsAgo(5).name, total_saved: 112.48, total_spent: 524.30, trips_count: 9 },
  { month: monthsAgo(4).name, total_saved: 98.76, total_spent: 487.15, trips_count: 8 },
  { month: monthsAgo(3).name, total_saved: 145.20, total_spent: 612.80, trips_count: 11 },
  { month: monthsAgo(2).name, total_saved: 134.59, total_spent: 558.42, trips_count: 10 },
  { month: monthsAgo(1).name, total_saved: 167.83, total_spent: 593.67, trips_count: 12 },
  { month: monthsAgo(0).name, total_saved: 188.46, total_spent: 631.20, trips_count: 14 },
]

export const DEMO_RECENT_COMPARISONS: RecentComparison[] = [
  {
    id: 'cmp-001',
    created_at: daysAgo(0),
    items_count: 12,
    total_savings: 8.47,
    best_store: 'ALDI',
    items: [
      { name: 'Whole Milk (1 gal)', your_price: 4.29, best_price: 3.15, savings: 1.14 },
      { name: 'Bananas (1 bunch)', your_price: 1.49, best_price: 0.89, savings: 0.60 },
      { name: 'Ground Beef 80/20 (1 lb)', your_price: 5.99, best_price: 4.79, savings: 1.20 },
    ],
  },
  {
    id: 'cmp-002',
    created_at: daysAgo(1),
    items_count: 8,
    total_savings: 5.23,
    best_store: 'Walmart',
    items: [
      { name: 'Large Eggs (dozen)', your_price: 3.89, best_price: 2.98, savings: 0.91 },
      { name: 'White Bread (loaf)', your_price: 3.49, best_price: 2.24, savings: 1.25 },
      { name: 'Cheddar Cheese (8 oz)', your_price: 4.29, best_price: 3.47, savings: 0.82 },
    ],
  },
  {
    id: 'cmp-003',
    created_at: daysAgo(3),
    items_count: 15,
    total_savings: 12.80,
    best_store: 'Kroger',
    items: [
      { name: 'Chicken Breast (1 lb)', your_price: 6.49, best_price: 4.99, savings: 1.50 },
      { name: 'Strawberries (16 oz)', your_price: 4.99, best_price: 3.49, savings: 1.50 },
      { name: 'Greek Yogurt (32 oz)', your_price: 6.29, best_price: 4.99, savings: 1.30 },
    ],
  },
  {
    id: 'cmp-004',
    created_at: daysAgo(5),
    items_count: 6,
    total_savings: 3.15,
    best_store: 'Target',
    items: [
      { name: 'Pasta Sauce (24 oz)', your_price: 3.99, best_price: 3.19, savings: 0.80 },
      { name: 'Spaghetti (16 oz)', your_price: 2.29, best_price: 1.49, savings: 0.80 },
      { name: 'Parmesan Cheese (5 oz)', your_price: 5.49, best_price: 4.99, savings: 0.50 },
    ],
  },
  {
    id: 'cmp-005',
    created_at: daysAgo(7),
    items_count: 20,
    total_savings: 15.62,
    best_store: 'ALDI',
    items: [
      { name: 'Baby Spinach (5 oz)', your_price: 3.99, best_price: 2.49, savings: 1.50 },
      { name: 'Avocados (each)', your_price: 1.99, best_price: 0.89, savings: 1.10 },
      { name: 'Orange Juice (52 oz)', your_price: 4.79, best_price: 3.29, savings: 1.50 },
    ],
  },
  {
    id: 'cmp-006',
    created_at: daysAgo(10),
    items_count: 9,
    total_savings: 6.94,
    best_store: 'Publix',
    items: [
      { name: 'Deli Turkey (1 lb)', your_price: 9.99, best_price: 7.99, savings: 2.00 },
      { name: 'Swiss Cheese (8 oz)', your_price: 5.49, best_price: 4.49, savings: 1.00 },
      { name: 'Sourdough Bread', your_price: 4.99, best_price: 3.99, savings: 1.00 },
    ],
  },
  {
    id: 'cmp-007',
    created_at: daysAgo(12),
    items_count: 11,
    total_savings: 7.38,
    best_store: 'Walmart',
    items: [
      { name: 'Peanut Butter (16 oz)', your_price: 4.49, best_price: 3.28, savings: 1.21 },
      { name: 'Grape Jelly (20 oz)', your_price: 3.79, best_price: 2.98, savings: 0.81 },
      { name: 'Tortilla Chips (13 oz)', your_price: 4.99, best_price: 3.98, savings: 1.01 },
    ],
  },
  {
    id: 'cmp-008',
    created_at: daysAgo(14),
    items_count: 7,
    total_savings: 4.21,
    best_store: 'Kroger',
    items: [
      { name: 'Butter (1 lb)', your_price: 5.49, best_price: 4.49, savings: 1.00 },
      { name: 'Heavy Cream (16 oz)', your_price: 4.99, best_price: 3.99, savings: 1.00 },
      { name: 'Cream Cheese (8 oz)', your_price: 3.29, best_price: 2.49, savings: 0.80 },
    ],
  },
]
