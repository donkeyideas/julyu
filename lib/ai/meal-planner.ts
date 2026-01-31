/**
 * Meal Planner
 * Generates weekly meal plans using LLM with budget and dietary constraints.
 * Can convert plans into shopping lists.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import { buildMealPlanningPrompt, type MealPlanInput } from '@/lib/llm/prompt-templates/meal-planning'
import type { LLMMessage } from '@/types/llm'

interface MealPlanDay {
  day: number
  dayName: string
  meals: Array<{
    type: string
    name: string
    servings: number
    prepTimeMinutes: number
    ingredients: Array<{ name: string; quantity: string; estimatedCost: number }>
    instructions: string
    estimatedCost: number
  }>
  dailyCost: number
}

interface MealPlanResult {
  days: MealPlanDay[]
  totalCost: number
  shoppingList: Array<{
    name: string
    totalQuantity: string
    estimatedCost: number
    category: string
  }>
  tips: string[]
}

export interface GenerateMealPlanOptions {
  budget: number
  days: number
  householdSize: number
  dietaryRestrictions: string[]
  preferredCuisines?: string[]
  dislikedIngredients?: string[]
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  maxPrepTimeMinutes?: number
}

/**
 * Generate a meal plan using the LLM.
 */
export async function generateMealPlan(
  userId: string,
  options: GenerateMealPlanOptions
): Promise<MealPlanResult> {
  const prompt = buildMealPlanningPrompt(options as MealPlanInput)

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are a meal planning assistant. Create detailed, budget-friendly meal plans that are practical and delicious. Always stay within the specified budget and respect dietary restrictions. Return valid JSON only.',
    },
    { role: 'user', content: prompt },
  ]

  const response = await llmOrchestrator.chat(messages, {
    taskType: 'meal_planning',
    userId,
    maxTokens: 4000,
    temperature: 0.6,
  })

  // Parse JSON
  const jsonMatch = response.content.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonMatch) throw new Error('Failed to parse meal plan response')
  const plan: MealPlanResult = JSON.parse(jsonMatch)

  return plan
}

/**
 * Save a meal plan to the database and optionally create a shopping list.
 */
export async function saveMealPlan(
  userId: string,
  plan: MealPlanResult,
  options: GenerateMealPlanOptions,
  createShoppingList: boolean = false
): Promise<{ mealPlanId: string | null; shoppingListId: string | null }> {
  const supabase = createServiceRoleClient() as any

  // Calculate week start (next Monday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek)
  const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000)
  const weekStart = nextMonday.toISOString().split('T')[0]

  // Save meal plan
  const { data: mealPlan, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      week_start: weekStart,
      budget: options.budget,
      dietary_restrictions: options.dietaryRestrictions,
      household_size: options.householdSize,
      plan_data: plan,
      total_estimated_cost: plan.totalCost,
    })
    .select('id')
    .single()

  if (planError) {
    console.error('[MealPlanner] Failed to save meal plan:', planError)
    return { mealPlanId: null, shoppingListId: null }
  }

  let shoppingListId: string | null = null

  // Create shopping list from meal plan
  if (createShoppingList && plan.shoppingList.length > 0) {
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name: `Meal Plan - Week of ${weekStart}`,
      })
      .select('id')
      .single()

    if (!listError && list) {
      shoppingListId = list.id

      // Link shopping list to meal plan
      await supabase
        .from('meal_plans')
        .update({ shopping_list_id: shoppingListId })
        .eq('id', mealPlan.id)

      // Add items
      const listItems = plan.shoppingList.map(item => ({
        list_id: shoppingListId!,
        user_input: `${item.totalQuantity} ${item.name}`,
        quantity: 1,
      }))

      await supabase.from('list_items').insert(listItems)
    }
  }

  return { mealPlanId: mealPlan.id, shoppingListId }
}
