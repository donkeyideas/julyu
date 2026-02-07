// Mock budget optimizer data for demo users
// All values represent a typical US grocery household budget

export interface BudgetCategory {
  category: string
  budgeted: number
  spent: number
  remaining: number
}

export interface BudgetRecommendation {
  id: string
  recommendation: string
}

export interface MonthlyBudget {
  total_budget: number
  total_spent: number
  remaining: number
}

export const DEMO_BUDGET_CATEGORIES: BudgetCategory[] = [
  { category: 'Groceries', budgeted: 600, spent: 487.32, remaining: 112.68 },
  { category: 'Household Supplies', budgeted: 80, spent: 62.47, remaining: 17.53 },
  { category: 'Baby Products', budgeted: 75, spent: 51.96, remaining: 23.04 },
  { category: 'Snacks & Beverages', budgeted: 45, spent: 21.25, remaining: 23.75 },
]

export const DEMO_BUDGET_RECOMMENDATIONS: BudgetRecommendation[] = [
  {
    id: 'rec-001',
    recommendation: 'You\'re on track to come in $47 under your grocery budget this month. Consider stocking up on non-perishable staples like rice, canned goods, and pasta while you have room in the budget.',
  },
  {
    id: 'rec-002',
    recommendation: 'Switching your weekly chicken and ground beef purchases from Publix to Kroger or ALDI could save you $12-18 per month based on your typical quantities.',
  },
  {
    id: 'rec-003',
    recommendation: 'Your household supplies spending is higher than average. Buying paper towels and trash bags in bulk at Walmart or Costco could reduce this category by 20%.',
  },
  {
    id: 'rec-004',
    recommendation: 'You\'ve been spending less on snacks this month -- great discipline! Redirecting that $23.75 surplus toward next month\'s grocery budget would give you more flexibility for meal planning.',
  },
]

export const DEMO_MONTHLY_BUDGET: MonthlyBudget = {
  total_budget: 800,
  total_spent: 623.00,
  remaining: 177.00,
}
