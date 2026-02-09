import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SUBJECTS = ['General Inquiry', 'Support', 'Feedback', 'Partnership', 'Other']

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, website } = body

    // Honeypot check - bots fill this hidden field
    if (website) {
      return NextResponse.json({ success: true, message: 'Message sent successfully!' })
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // Validate subject
    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json(
        { error: 'Please select a valid subject.' },
        { status: 400 }
      )
    }

    // Validate lengths
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less.' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be 5000 characters or less.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      console.error('[Contact] Supabase not configured')
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 })
    }

    // Rate limiting: max 3 messages per email per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('created_at', twentyFourHoursAgo)

    if (countError) {
      console.error('[Contact] Rate limit check error:', countError)
    }

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: 'You have reached the message limit. Please try again later.' },
        { status: 429 }
      )
    }

    // Insert message
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        subject,
        message: message.trim(),
      })

    if (insertError) {
      console.error('[Contact] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully!' })
  } catch (error) {
    console.error('[Contact] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
