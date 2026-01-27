/**
 * Smart List Builder Prompt Template
 * Generates optimized shopping lists from natural language requests.
 */

import type { PromptTemplate } from '@/types/llm'

export interface ListBuilderInput {
  request: string
  dietaryRestrictions?: string[]
  budgetLimit?: number
  householdSize?: number
  preferredStores?: string[]
}

export function buildListBuilderPrompt(input: ListBuilderInput): string {
  let prompt = `Generate a detailed shopping list based on this request: "${input.request}"\n\n`

  if (input.dietaryRestrictions && input.dietaryRestrictions.length > 0) {
    prompt += `Dietary restrictions (MUST follow): ${input.dietaryRestrictions.join(', ')}\n`
  }

  if (input.budgetLimit) {
    prompt += `Budget limit: $${input.budgetLimit.toFixed(2)}\n`
  }

  if (input.householdSize) {
    prompt += `Household size: ${input.householdSize} people\n`
  }

  prompt += `\nReturn a JSON object with this exact structure:
{
  "listName": "A descriptive name for this shopping list",
  "items": [
    {
      "name": "item name (generic, searchable)",
      "quantity": 2,
      "unit": "lbs|oz|cups|each|dozen|gallon|bunch|bag|can|box|bottle|pack|null",
      "category": "produce|dairy|meat|bakery|frozen|pantry|beverages|snacks|condiments|other",
      "estimatedPrice": 3.99,
      "notes": "optional notes (e.g., 'organic preferred', 'any brand')"
    }
  ],
  "estimatedTotal": 45.50,
  "servings": 4,
  "tips": ["Shopping tips relevant to this list"]
}

Rules:
- Use generic product names that would match grocery store products
- Group items by category
- Provide realistic US grocery price estimates
- Include quantities appropriate for the request
- Stay within budget if specified
- Suggest store-brand alternatives in notes when possible`

  return prompt
}

export const listBuilderTemplate: PromptTemplate = {
  id: 'list-builder',
  taskType: 'list_building',
  systemPrompt: 'You are a smart shopping list generator. Create detailed, organized shopping lists from natural language requests. Be practical with quantities and provide accurate price estimates for US grocery stores.',
  buildUserPrompt: (params) => buildListBuilderPrompt(params as unknown as ListBuilderInput),
  defaultOptions: {
    temperature: 0.5,
    maxTokens: 2000,
    responseFormat: 'json',
    timeout: 45000,
  },
}
