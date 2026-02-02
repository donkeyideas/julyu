import { apiClient } from './api'

export interface SavingsData {
  total_saved: number
  this_month: number
  last_month: number
  monthly_goal: number
  goal_progress: number
  trend_percentage: number
  receipts_count: number
  lists_count: number
}

export interface MonthlySavings {
  month: string
  amount: number
}

export async function getSavings(): Promise<SavingsData> {
  return apiClient<SavingsData>('/savings')
}

export async function getMonthlySavings(): Promise<MonthlySavings[]> {
  return apiClient<MonthlySavings[]>('/savings/monthly')
}

export async function updateSavingsGoal(goal: number): Promise<void> {
  await apiClient('/savings/goal', {
    method: 'POST',
    body: { goal },
  })
}
