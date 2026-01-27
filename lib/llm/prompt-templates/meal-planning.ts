/**
 * Meal Planning Prompt Template
 * Generates weekly meal plans with budget and dietary constraints.
 */

import type { PromptTemplate } from '@/types/llm'

export interface MealPlanInput {
  budget: number
  days: number
  householdSize: number
  dietaryRestrictions: string[]
  preferredCuisines?: string[]
  dislikedIngredients?: string[]
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  maxPrepTimeMinutes?: number
}

export function buildMealPlanningPrompt(input: MealPlanInput): string {
  let prompt = `Create a ${input.days}-day meal plan with the following constraints:\n\n`

  prompt += `Budget: $${input.budget.toFixed(2)} total\n`
  prompt += `Household size: ${input.householdSize} people\n`
  prompt += `Per-meal budget target: ~$${(input.budget / (input.days * 2.5)).toFixed(2)}\n\n`

  if (input.dietaryRestrictions.length > 0) {
    prompt += `Dietary restrictions (MUST follow): ${input.dietaryRestrictions.join(', ')}\n`
  }

  if (input.preferredCuisines && input.preferredCuisines.length > 0) {
    prompt += `Preferred cuisines: ${input.preferredCuisines.join(', ')}\n`
  }

  if (input.dislikedIngredients && input.dislikedIngredients.length > 0) {
    prompt += `Avoid: ${input.dislikedIngredients.join(', ')}\n`
  }

  if (input.skillLevel) {
    prompt += `Cooking skill: ${input.skillLevel}\n`
  }

  if (input.maxPrepTimeMinutes) {
    prompt += `Max prep time per meal: ${input.maxPrepTimeMinutes} minutes\n`
  }

  prompt += `\nReturn a JSON object with this exact structure:
{
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "meals": [
        {
          "type": "breakfast|lunch|dinner|snack",
          "name": "Meal Name",
          "servings": ${input.householdSize},
          "prepTimeMinutes": 20,
          "ingredients": [
            { "name": "ingredient name", "quantity": "2 cups", "estimatedCost": 3.50 }
          ],
          "instructions": "Brief cooking instructions",
          "estimatedCost": 12.50
        }
      ],
      "dailyCost": 28.50
    }
  ],
  "totalCost": 199.50,
  "shoppingList": [
    { "name": "ingredient", "totalQuantity": "4 cups", "estimatedCost": 5.99, "category": "produce" }
  ],
  "tips": ["Tip for saving money or meal prep"]
}

Rules:
- Stay within budget
- Reuse ingredients across meals to minimize waste and cost
- Include variety across days
- Consolidate shopping list (combine same ingredients)
- Provide realistic cost estimates for US grocery stores`

  return prompt
}

export const mealPlanningTemplate: PromptTemplate = {
  id: 'meal-planning',
  taskType: 'meal_planning',
  systemPrompt: 'You are a meal planning assistant. Create detailed, budget-friendly meal plans that are practical and delicious. Always stay within the specified budget and respect dietary restrictions.',
  buildUserPrompt: (params) => buildMealPlanningPrompt(params as unknown as MealPlanInput),
  defaultOptions: {
    temperature: 0.6,
    maxTokens: 4000,
    responseFormat: 'json',
    timeout: 60000,
  },
}
