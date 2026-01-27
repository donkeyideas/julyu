/**
 * AI Action Tools Registry
 * Central registry for all AI assistant action tools.
 */

import type { ActionType, ActionResult, ActionTool } from './types'
import { addToListTool } from './add-to-list'
import { setAlertTool } from './set-alert'
import { checkBudgetTool } from './check-budget'
import { searchPricesTool } from './search-prices'
import { findStoresTool } from './find-stores'

export type { ActionType, ActionResult, ActionTool } from './types'

const tools: Map<ActionType, ActionTool> = new Map([
  ['ADD_TO_LIST', addToListTool],
  ['SET_ALERT', setAlertTool],
  ['CHECK_BUDGET', checkBudgetTool],
  ['SEARCH_PRICES', searchPricesTool],
  ['FIND_STORES', findStoresTool],
])

/**
 * Execute an AI action by type.
 */
export async function executeAction(
  action: ActionType,
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const tool = tools.get(action)
  if (!tool) {
    return {
      success: false,
      action,
      message: `Unknown action: ${action}`,
    }
  }

  try {
    return await tool.execute(params, userId)
  } catch (error) {
    console.error(`[AI Tools] Action ${action} failed:`, error)
    return {
      success: false,
      action,
      message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Parse action blocks from AI response text.
 * Looks for [ACTION:TYPE] param1, param2 patterns.
 */
export function parseActionsFromResponse(response: string): Array<{
  action: ActionType
  rawParams: string
  params: Record<string, unknown>
}> {
  const actionPattern = /\[ACTION:(ADD_TO_LIST|SET_ALERT|CHECK_BUDGET|SEARCH_PRICES|FIND_STORES)\]\s*(.+?)(?:\n|$)/g
  const actions: Array<{
    action: ActionType
    rawParams: string
    params: Record<string, unknown>
  }> = []

  let match
  while ((match = actionPattern.exec(response)) !== null) {
    const action = match[1] as ActionType
    const rawParams = match[2].trim()
    const params = parseActionParams(action, rawParams)
    actions.push({ action, rawParams, params })
  }

  return actions
}

/**
 * Parse raw parameter string into structured params based on action type.
 */
function parseActionParams(
  action: ActionType,
  raw: string
): Record<string, unknown> {
  switch (action) {
    case 'ADD_TO_LIST': {
      // Format: item name, quantity
      const parts = raw.split(',').map(s => s.trim())
      return {
        item: parts[0] || raw,
        quantity: parts[1] ? parseInt(parts[1], 10) || 1 : 1,
      }
    }
    case 'SET_ALERT': {
      // Format: product name, target price
      const parts = raw.split(',').map(s => s.trim())
      const priceStr = parts[1]?.replace(/[^0-9.]/g, '')
      return {
        product: parts[0] || raw,
        targetPrice: priceStr ? parseFloat(priceStr) : 0,
      }
    }
    case 'CHECK_BUDGET': {
      // Format: category (optional)
      return { category: raw || undefined }
    }
    case 'SEARCH_PRICES': {
      // Format: search query
      return { query: raw }
    }
    case 'FIND_STORES': {
      // Format: retailer name or location
      return { retailer: raw }
    }
    default:
      return { raw }
  }
}

/**
 * List all available tools with descriptions.
 */
export function listAvailableTools(): Array<{ action: ActionType; description: string }> {
  return Array.from(tools.entries()).map(([action, tool]) => ({
    action,
    description: tool.description,
  }))
}
