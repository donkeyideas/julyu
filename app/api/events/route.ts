/**
 * POST /api/events
 * Ingests batched user behavioral events from the client-side tracker.
 */

import { NextResponse } from 'next/server'
import { trackBatchEvents } from '@/lib/events/server-tracker'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { events, userId } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Missing events array' }, { status: 400 })
    }

    // Get user ID from header or body
    const resolvedUserId =
      request.headers.get('x-user-id') || userId || 'anonymous'

    await trackBatchEvents(resolvedUserId, events)

    return NextResponse.json({ success: true, count: events.length })
  } catch (error) {
    console.error('[Events API] Error:', error)
    return NextResponse.json({ error: 'Failed to track events' }, { status: 500 })
  }
}
