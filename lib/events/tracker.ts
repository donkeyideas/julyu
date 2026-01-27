/**
 * Client-side Event Tracker
 * Batches and sends behavioral events to the backend.
 */

import type { UserEvent, EventType } from './types'

const BATCH_SIZE = 10
const FLUSH_INTERVAL_MS = 5000

class EventTracker {
  private queue: UserEvent[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private sessionId: string
  private userId: string | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  /** Set the current user ID (call after login) */
  setUserId(userId: string) {
    this.userId = userId
  }

  /** Track a user event */
  track(eventType: EventType, eventData: Record<string, unknown> = {}) {
    this.queue.push({
      eventType,
      eventData: {
        ...eventData,
        timestamp: new Date().toISOString(),
      },
      sessionId: this.sessionId,
    })

    if (this.queue.length >= BATCH_SIZE) {
      this.flush()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS)
    }
  }

  /** Send queued events to the backend */
  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          userId: this.userId,
        }),
      })
    } catch (error) {
      // Re-queue on failure (but cap to prevent memory leaks)
      if (this.queue.length < 100) {
        this.queue.unshift(...events)
      }
      console.warn('[EventTracker] Failed to send events:', error)
    }
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// Singleton
export const eventTracker = new EventTracker()
