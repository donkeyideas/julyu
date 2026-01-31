/**
 * Server-side Event Tracker
 * Writes events directly to Supabase from API routes.
 */

import { createServerClient } from '@/lib/supabase/server'
import type { EventType, ServerEvent } from './types'

/**
 * Track a server-side event (call from API routes)
 */
export async function trackServerEvent(
  userId: string,
  eventType: EventType,
  eventData: Record<string, unknown> = {},
  sessionId?: string
): Promise<void> {
  try {
    const supabase = await createServerClient()
    await supabase.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      session_id: sessionId,
    })
  } catch (error) {
    // Non-critical — don't break the request
    console.warn('[Server Event Tracker] Failed to track event:', error)
  }
}

/**
 * Batch insert events (from client-side tracker flush)
 */
export async function trackBatchEvents(
  userId: string,
  events: Array<{ eventType: string; eventData: Record<string, unknown>; sessionId?: string }>
): Promise<void> {
  try {
    const supabase = await createServerClient()
    const rows = events.map(e => ({
      user_id: userId,
      event_type: e.eventType,
      event_data: e.eventData,
      session_id: e.sessionId,
    }))

    await supabase.from('user_events').insert(rows)
  } catch (error) {
    console.warn('[Server Event Tracker] Failed to batch track events:', error)
  }
}
