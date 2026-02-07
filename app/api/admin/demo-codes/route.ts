import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateDemoCode(): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `JULYU-${bytes.slice(0, 4)}`
}

// GET: List demo requests and codes
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'requests'

    if (tab === 'requests') {
      const status = searchParams.get('status')
      let query = supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data: requests, error } = await query
      if (error) throw error

      // Get stats
      const { count: pendingCount } = await supabase
        .from('demo_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: approvedCount } = await supabase
        .from('demo_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      const { count: activeCodesCount } = await supabase
        .from('demo_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { data: usageData } = await supabase
        .from('demo_codes')
        .select('uses_count')

      const totalUses = usageData?.reduce((sum, c) => sum + (c.uses_count || 0), 0) || 0

      return NextResponse.json({
        requests: requests || [],
        stats: {
          pending: pendingCount || 0,
          approved: approvedCount || 0,
          activeCodes: activeCodesCount || 0,
          totalUses,
        },
      })
    }

    if (tab === 'codes') {
      const { data: codes, error } = await supabase
        .from('demo_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ codes: codes || [] })
    }

    return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
  } catch (error) {
    console.error('[Admin Demo Codes] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Generate new demo code (manual or from approval)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const { request_id, email, name, demo_type, expires_days = 30 } = body

    if (!email || !demo_type) {
      return NextResponse.json(
        { error: 'Email and demo type are required' },
        { status: 400 }
      )
    }

    const code = generateDemoCode()
    const expiresAt = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()

    // Insert demo code
    const { data: newCode, error: insertError } = await supabase
      .from('demo_codes')
      .insert({
        code,
        demo_type,
        request_id: request_id || null,
        email,
        name: name || null,
        is_active: true,
        uses_count: 0,
        max_uses: 100,
        expires_at: expiresAt,
        created_by: 'admin',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Admin Demo Codes] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
    }

    // If from a request, update request status
    if (request_id) {
      await supabase
        .from('demo_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', request_id)
    }

    // Send approval email
    try {
      const { sendDemoApprovalEmail } = await import('@/lib/services/email')
      await sendDemoApprovalEmail({
        name: name || 'there',
        email,
        code,
        demoType: demo_type,
        expiresAt,
      })
    } catch (emailError) {
      console.warn('[Admin Demo Codes] Email send failed:', emailError)
    }

    return NextResponse.json({ success: true, code: newCode })
  } catch (error) {
    console.error('[Admin Demo Codes] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update request/code status
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const { id, action, rejection_reason, type } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    if (action === 'reject' && type === 'request') {
      // Get request info for email
      const { data: reqData } = await supabase
        .from('demo_requests')
        .select('email, name')
        .eq('id', id)
        .single()

      await supabase
        .from('demo_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason || 'Application not approved at this time.',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', id)

      // Send rejection email
      if (reqData) {
        try {
          const { sendDemoRejectionEmail } = await import('@/lib/services/email')
          await sendDemoRejectionEmail({
            name: reqData.name,
            email: reqData.email,
            reason: rejection_reason || 'Application not approved at this time.',
          })
        } catch (emailError) {
          console.warn('[Admin Demo Codes] Rejection email failed:', emailError)
        }
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'deactivate') {
      await supabase
        .from('demo_codes')
        .update({ is_active: false })
        .eq('id', id)
      return NextResponse.json({ success: true })
    }

    if (action === 'reactivate') {
      await supabase
        .from('demo_codes')
        .update({ is_active: true })
        .eq('id', id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Admin Demo Codes] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove request or code
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    const table = type === 'request' ? 'demo_requests' : 'demo_codes'
    const { error } = await supabase.from(table).delete().eq('id', id)

    if (error) {
      console.error('[Admin Demo Codes] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Demo Codes] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
