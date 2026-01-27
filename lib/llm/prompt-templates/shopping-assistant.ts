/**
 * Shopping Assistant Prompt Template
 * Builds context-aware system prompts for the conversational AI assistant.
 */

import type { PromptTemplate } from '@/types/llm'

export interface ShoppingAssistantContext {
  dietaryRestrictions?: string[]
  budgetMonthly?: number
  budgetRemaining?: number
  favoriteStores?: string[]
  recentPurchases?: Array<{ store: string; total: number; date: string }>
  activeListItems?: string[]
  pendingAlerts?: Array<{ product: string; targetPrice: number }>
  householdSize?: number
}

export function buildShoppingAssistantPrompt(context?: ShoppingAssistantContext): string {
  let prompt = `You are Julyu AI, an intelligent shopping assistant for a grocery price comparison platform. You help users:
- Find the best deals and prices on groceries
- Create and optimize shopping lists
- Suggest recipes based on budget and dietary preferences
- Plan meals for the week
- Find product alternatives and substitutions
- Analyze spending patterns and suggest savings
- Set price alerts for products they want

Be concise, friendly, and actionable. Focus on specific recommendations that save money.
When suggesting products or stores, be specific with names and prices when available.
Prices may vary by location and change frequently — always note this.
If the user asks you to do something (add to list, set alert), format your response with a clear action block.

ACTION FORMAT (when the user requests an action):
[ACTION:ADD_TO_LIST] item name, quantity
[ACTION:SET_ALERT] product name, target price
[ACTION:CHECK_BUDGET] category (optional)
`

  if (!context) return prompt

  const {
    dietaryRestrictions,
    budgetMonthly,
    budgetRemaining,
    favoriteStores,
    recentPurchases,
    activeListItems,
    pendingAlerts,
    householdSize,
  } = context

  prompt += '\n--- USER CONTEXT ---\n'

  if (householdSize) {
    prompt += `Household size: ${householdSize} people\n`
  }

  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    prompt += `Dietary restrictions: ${dietaryRestrictions.join(', ')}\n`
    prompt += `IMPORTANT: Never suggest products that violate these restrictions.\n`
  }

  if (budgetMonthly) {
    prompt += `Monthly grocery budget: $${budgetMonthly}\n`
    if (budgetRemaining !== undefined) {
      prompt += `Budget remaining this month: $${budgetRemaining.toFixed(2)}\n`
    }
  }

  if (favoriteStores && favoriteStores.length > 0) {
    prompt += `Preferred stores: ${favoriteStores.join(', ')}\n`
  }

  if (recentPurchases && recentPurchases.length > 0) {
    const receiptsInfo = recentPurchases.slice(0, 5).map(r =>
      `${r.store} ($${r.total.toFixed(2)} on ${r.date})`
    ).join(', ')
    prompt += `Recent shopping: ${receiptsInfo}\n`
  }

  if (activeListItems && activeListItems.length > 0) {
    prompt += `Current shopping list: ${activeListItems.slice(0, 15).join(', ')}\n`
  }

  if (pendingAlerts && pendingAlerts.length > 0) {
    const alertsInfo = pendingAlerts.slice(0, 5).map(a =>
      `${a.product} (target: $${a.targetPrice})`
    ).join(', ')
    prompt += `Active price alerts: ${alertsInfo}\n`
  }

  prompt += '--- END CONTEXT ---\n'
  return prompt
}

export const shoppingAssistantTemplate: PromptTemplate = {
  id: 'shopping-assistant',
  taskType: 'chat',
  systemPrompt: buildShoppingAssistantPrompt(),
  buildUserPrompt: (params) => params.message as string,
  defaultOptions: {
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 60000,
  },
}
