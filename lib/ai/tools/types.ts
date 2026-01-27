/**
 * AI Tool Types
 * Defines the interface for AI assistant action tools.
 */

export type ActionType =
  | 'ADD_TO_LIST'
  | 'SET_ALERT'
  | 'CHECK_BUDGET'
  | 'SEARCH_PRICES'
  | 'FIND_STORES'

export interface ActionRequest {
  action: ActionType
  params: Record<string, unknown>
  userId: string
}

export interface ActionResult {
  success: boolean
  action: ActionType
  message: string
  data?: Record<string, unknown>
}

export interface ActionTool {
  action: ActionType
  description: string
  execute: (params: Record<string, unknown>, userId: string) => Promise<ActionResult>
}
