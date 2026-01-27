/**
 * Event Types for behavioral data collection.
 * Every event type represents a user or system action that feeds the data flywheel.
 */

export type EventType =
  // Shopping & Comparison
  | 'price_comparison_search'
  | 'price_comparison_result_selected'
  | 'shopping_list_created'
  | 'shopping_list_item_added'
  | 'shopping_list_item_removed'
  // Receipts
  | 'receipt_uploaded'
  | 'receipt_item_corrected'
  | 'receipt_scan_completed'
  // AI
  | 'ai_chat_message_sent'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_rejected'
  | 'ai_product_match_corrected'
  // Alerts
  | 'price_alert_created'
  | 'price_alert_triggered'
  | 'price_alert_acted_on'
  // Budget
  | 'budget_set'
  | 'budget_exceeded'
  // Delivery
  | 'delivery_partner_clicked'
  // Engagement
  | 'feature_used'
  | 'page_viewed'
  // Product
  | 'product_substitution'
  | 'product_favorited'

export interface UserEvent {
  eventType: EventType
  eventData: Record<string, unknown>
  sessionId?: string
}

export interface ServerEvent extends UserEvent {
  userId: string
}
