/**
 * POST /api/ai/meal-plan
 * Generate a weekly meal plan with budget and dietary constraints.
 *
 * GET /api/ai/meal-plan
 * Get saved meal plans for the user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { generateMealPlan, saveMealPlan, type GenerateMealPlanOptions } from '@/lib/ai/meal-planner'
import { hasFeature } from '@/lib/subscriptions/feature-gate'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeature(userId, 'meal_planning')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const body = await request.json()
    const {
      budget,
      days = 7,
      householdSize = 1,
      dietaryRestrictions = [],
      preferredCuisines,
      dislikedIngredients,
      skillLevel,
      maxPrepTimeMinutes,
      save = false,
      createShoppingList = false,
    } = body as GenerateMealPlanOptions & { save?: boolean; createShoppingList?: boolean }

    if (!budget || budget <= 0) {
      return NextResponse.json({ error: 'Budget is required and must be positive' }, { status: 400 })
    }

    // Get user dietary restrictions from preferences if not provided
    let finalDietary = dietaryRestrictions
    if (finalDietary.length === 0) {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('dietary_restrictions')
        .eq('user_id', userId)
        .single()
      finalDietary = (prefs?.dietary_restrictions as string[]) || []
    }

    const options: GenerateMealPlanOptions = {
      budget,
      days,
      householdSize,
      dietaryRestrictions: finalDietary,
      preferredCuisines,
      dislikedIngredients,
      skillLevel,
      maxPrepTimeMinutes,
    }

    const plan = await generateMealPlan(userId, options)

    let mealPlanId = null
    let shoppingListId = null

    if (save) {
      const saved = await saveMealPlan(userId, plan, options, createShoppingList)
      mealPlanId = saved.mealPlanId
      shoppingListId = saved.shoppingListId
    }

    return NextResponse.json({
      ...plan,
      mealPlanId,
      shoppingListId,
    })
  } catch (error) {
    console.error('[MealPlan] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate meal plan' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbClient = createServiceRoleClient()

    const { data: plans } = await dbClient
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ plans: plans || [] })
  } catch (error) {
    console.error('[MealPlan] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    )
  }
}
