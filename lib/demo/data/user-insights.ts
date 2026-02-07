// Mock insights and spending analytics for demo users
// All dates are relative to now so data always looks fresh

export interface SpendingCategory {
  category: string
  amount: number
}

export interface Insight {
  id: string
  type: 'savings_tip' | 'trend' | 'deal'
  title: string
  description: string
  potential_savings: number
}

export interface SpendingTrend {
  month: string
  total_spent: number
}

function monthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export const DEMO_SPENDING_BY_CATEGORY: SpendingCategory[] = [
  { category: 'Produce', amount: 234.18 },
  { category: 'Dairy', amount: 178.42 },
  { category: 'Meat & Seafood', amount: 312.67 },
  { category: 'Bakery & Bread', amount: 87.53 },
  { category: 'Frozen Foods', amount: 95.24 },
  { category: 'Snacks & Beverages', amount: 142.89 },
  { category: 'Pantry Staples', amount: 118.36 },
  { category: 'Baby & Household', amount: 164.91 },
]

export const DEMO_INSIGHTS: Insight[] = [
  {
    id: 'insight-001',
    type: 'savings_tip',
    title: 'Switch to ALDI for dairy products',
    description: 'Based on your last 3 months of purchases, you could save an average of $4.82 per trip by buying dairy items at ALDI instead of Publix. Their store-brand milk, cheese, and yogurt are consistently 20-30% cheaper.',
    potential_savings: 19.28,
  },
  {
    id: 'insight-002',
    type: 'trend',
    title: 'Your meat spending is trending up',
    description: 'You\'ve spent 18% more on meat and seafood this month compared to your 3-month average. Consider buying family packs at Kroger or checking Walmart\'s weekly deals on ground beef and chicken breast.',
    potential_savings: 24.50,
  },
  {
    id: 'insight-003',
    type: 'deal',
    title: 'Kroger has BOGO on chicken breast this week',
    description: 'Kroger is running a buy-one-get-one-free deal on boneless chicken breast through this weekend. Since you buy chicken weekly, stocking up could save you significantly over the next two weeks.',
    potential_savings: 9.98,
  },
  {
    id: 'insight-004',
    type: 'savings_tip',
    title: 'Buy produce at your local farmers market',
    description: 'You spend an average of $58 on produce per week. Seasonal fruits and vegetables at farmers markets are typically 15-25% cheaper than grocery stores, and they\'re fresher too.',
    potential_savings: 14.50,
  },
  {
    id: 'insight-005',
    type: 'trend',
    title: 'Your snack spending has decreased',
    description: 'Great job! You\'ve cut snack and beverage spending by 12% over the last 2 months. You\'re saving about $8.40 per month compared to earlier this year by switching to store brands.',
    potential_savings: 0,
  },
  {
    id: 'insight-006',
    type: 'deal',
    title: 'Stock up on pasta at Target this week',
    description: 'Target has Barilla pasta on sale for $0.99 per box (normally $1.89). Your purchase history shows you buy pasta every 2 weeks -- grabbing a few extra boxes now would lock in the savings.',
    potential_savings: 5.40,
  },
]

export const DEMO_SPENDING_TRENDS: SpendingTrend[] = [
  { month: monthsAgo(5), total_spent: 524.30 },
  { month: monthsAgo(4), total_spent: 487.15 },
  { month: monthsAgo(3), total_spent: 612.80 },
  { month: monthsAgo(2), total_spent: 558.42 },
  { month: monthsAgo(1), total_spent: 593.67 },
  { month: monthsAgo(0), total_spent: 631.20 },
]
