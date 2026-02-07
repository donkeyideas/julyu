import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, business_name, business_type, interest, message, honeypot } = body

    // Bot protection - honeypot field should be empty
    if (honeypot) {
      return NextResponse.json({ success: true, message: 'Request submitted' })
    }

    // Validate required fields
    if (!name || !email || !business_type || !interest) {
      return NextResponse.json(
        { error: 'Name, email, business type, and interest are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate business_type
    const validTypes = ['grocery_chain', 'independent_store', 'bodega', 'corner_store', 'market', 'specialty_store', 'consumer', 'other']
    if (!validTypes.includes(business_type)) {
      return NextResponse.json(
        { error: 'Invalid business type' },
        { status: 400 }
      )
    }

    // Validate interest
    const validInterests = ['user_demo', 'store_demo', 'both']
    if (!validInterests.includes(interest)) {
      return NextResponse.json(
        { error: 'Invalid interest selection' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Demo Request] Supabase not configured')
      return NextResponse.json({ success: true, message: 'Request submitted' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rate limit: max 3 requests per email per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', twentyFourHoursAgo)

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Insert demo request
    const { error: insertError } = await supabase
      .from('demo_requests')
      .insert({
        name,
        email,
        business_name: business_name || null,
        business_type,
        interest,
        message: message?.slice(0, 500) || null,
        status: 'pending',
      })

    if (insertError) {
      console.error('[Demo Request] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      )
    }

    // Send confirmation email
    try {
      const { sendDemoRequestConfirmationEmail } = await import('@/lib/services/email')
      await sendDemoRequestConfirmationEmail({ name, email })
    } catch (emailError) {
      console.warn('[Demo Request] Email send failed:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully. We\'ll review it within 24 hours.',
    })
  } catch (error) {
    console.error('[Demo Request] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
