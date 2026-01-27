/**
 * Prompt Templates Index
 * Central registry of all prompt templates for the LLM orchestrator.
 */

import type { PromptTemplate, LLMTaskType } from '@/types/llm'
import { shoppingAssistantTemplate } from './shopping-assistant'
import { productMatchingTemplate } from './product-matching'
import { receiptOCRTemplate } from './receipt-ocr'
import { priceAnalysisTemplate } from './price-analysis'
import { mealPlanningTemplate } from './meal-planning'
import { listBuilderTemplate } from './list-builder'

const templates: Record<string, PromptTemplate> = {
  'shopping-assistant': shoppingAssistantTemplate,
  'product-matching': productMatchingTemplate,
  'receipt-ocr': receiptOCRTemplate,
  'price-analysis': priceAnalysisTemplate,
  'meal-planning': mealPlanningTemplate,
  'list-builder': listBuilderTemplate,
}

/**
 * Get a prompt template by ID
 */
export function getTemplate(id: string): PromptTemplate | undefined {
  return templates[id]
}

/**
 * Get the default template for a task type
 */
export function getTemplateForTask(taskType: LLMTaskType): PromptTemplate | undefined {
  return Object.values(templates).find(t => t.taskType === taskType)
}

/**
 * List all registered template IDs
 */
export function listTemplates(): string[] {
  return Object.keys(templates)
}

export {
  shoppingAssistantTemplate,
  productMatchingTemplate,
  receiptOCRTemplate,
  priceAnalysisTemplate,
  mealPlanningTemplate,
  listBuilderTemplate,
}
