/**
 * Product Matching Prompt Template
 * Converts user input to structured product data using semantic understanding.
 */

import type { PromptTemplate } from '@/types/llm'

export interface ProductMatchingInput {
  items: string[]
  dietaryRestrictions?: string[]
  preferredBrands?: string[]
  location?: { lat: number; lng: number }
}

export function buildProductMatchingPrompt(input: ProductMatchingInput): string {
  let prompt = `Match these grocery items to structured product data:\n\n`

  input.items.forEach((item, index) => {
    prompt += `${index + 1}. ${item}\n`
  })

  if (input.dietaryRestrictions && input.dietaryRestrictions.length > 0) {
    prompt += `\nDietary restrictions: ${input.dietaryRestrictions.join(', ')}\n`
  }

  if (input.preferredBrands && input.preferredBrands.length > 0) {
    prompt += `Preferred brands: ${input.preferredBrands.join(', ')}\n`
  }

  prompt += `\nReturn a JSON array with this exact structure for each item:
[
  {
    "userInput": "original input text",
    "matchedProduct": "canonical product name",
    "brand": "brand name or null",
    "category": "product category (dairy, produce, meat, bakery, snacks, beverages, pantry, frozen, household, other)",
    "size": "size/quantity string or null",
    "attributes": {
      "organic": false,
      "glutenFree": false,
      "dairyFree": false,
      "vegan": false
    },
    "confidence": 0.95
  }
]

Rules:
- Always return valid JSON
- Set confidence between 0.0-1.0
- Use standard product names (e.g., "2% Reduced Fat Milk" not "milk")
- If brand isn't specified, set to null
- Category must be one of the listed values`

  return prompt
}

export const productMatchingTemplate: PromptTemplate = {
  id: 'product-matching',
  taskType: 'product_matching',
  systemPrompt: 'You are a product matching AI for a grocery price comparison platform. Match user input to structured product data with high accuracy. Always return valid JSON.',
  buildUserPrompt: (params) => buildProductMatchingPrompt(params as unknown as ProductMatchingInput),
  defaultOptions: {
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: 'json',
    timeout: 30000,
  },
}
