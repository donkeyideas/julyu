/**
 * POST /api/ai/smart-list
 * Generates an optimized shopping list from natural language input.
 * Flow: User request → LLM generates items → Optimizer matches products & finds prices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import { buildListBuilderPrompt } from '@/lib/llm/prompt-templates/list-builder'
import { optimizeShoppingList, saveOptimizedList } from '@/lib/ai/list-optimizer'
import { hasFeature } from '@/lib/subscriptions/feature-gate'
import type { LLMMessage } from '@/types/llm'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeature(userId, 'smart_lists')
    if (!allowed) {
      return NextResponse.json({ error: 'Upgrade required', upgradeUrl: '/pricing' }, { status: 403 })
    }

    const body = await request.json()
    const { request: userRequest, budget, save } = body as {
      request: string
      budget?: number
      save?: boolean
    }

    if (!userRequest || typeof userRequest !== 'string') {
      return NextResponse.json({ error: 'Request text is required' }, { status: 400 })
    }

    // Get user preferences for context
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('dietary_restrictions, preferred_retailers')
      .eq('user_id', userId)
      .single()

    const dietaryRestrictions = (prefs?.dietary_restrictions as string[]) || []
    const preferredStores = (prefs?.preferred_retailers as string[]) || []

    // Generate list with LLM
    const prompt = buildListBuilderPrompt({
      request: userRequest,
      dietaryRestrictions,
      budgetLimit: budget,
      preferredStores,
    })

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a smart shopping list generator. Create detailed, organized shopping lists from natural language requests. Always return valid JSON.',
      },
      { role: 'user', content: prompt },
    ]

    const llmResponse = await llmOrchestrator.chat(messages, {
      taskType: 'list_building',
      userId,
    })

    // Parse the generated list
    let generatedList
    try {
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/)?.[0]
      if (!jsonMatch) throw new Error('No JSON found in response')
      generatedList = JSON.parse(jsonMatch)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Optimize: match to real products and find best prices
    const ingredients = (generatedList.items || []).map((item: {
      name: string
      quantity?: number
      unit?: string
    }) => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || undefined,
    }))

    const optimizedResult = await optimizeShoppingList(ingredients, userId)

    // Optionally save as a shopping list
    let savedListId = null
    if (save) {
      const { listId } = await saveOptimizedList(
        userId,
        generatedList.listName || 'Smart List',
        optimizedResult.items
      )
      savedListId = listId
    }

    return NextResponse.json({
      listName: generatedList.listName,
      items: optimizedResult.items,
      storeTotals: optimizedResult.storeTotals,
      bestStore: optimizedResult.bestStore,
      estimatedTotal: optimizedResult.estimatedTotal,
      aiEstimatedTotal: generatedList.estimatedTotal,
      potentialSavings: optimizedResult.potentialSavings,
      servings: generatedList.servings,
      tips: generatedList.tips || [],
      savedListId,
      model: llmResponse.model,
    })
  } catch (error) {
    console.error('[SmartList] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate list' },
      { status: 500 }
    )
  }
}
