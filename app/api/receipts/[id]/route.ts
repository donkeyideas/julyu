import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: receiptId } = params

    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null

    try {
      const supabase = createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      }
    } catch (authError) {
      console.error('[Receipt] Supabase auth failed (trying Firebase):', authError)
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbClient = createServiceRoleClient()

    const { data: receipt, error } = await dbClient
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[Receipt] Get error:', JSON.stringify(error))
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to load receipt', details: error.message },
        { status: 500 }
      )
    }

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Transform OCR result to match frontend expected structure if needed
    if (receipt.ocr_result) {
      const ocr = receipt.ocr_result as Record<string, unknown>
      // Handle legacy format (store.name -> storeName)
      if (ocr.store && !ocr.storeName) {
        const store = ocr.store as { name?: string; address?: string }
        receipt.ocr_result = {
          ...ocr,
          storeName: store?.name || 'Unknown Store',
          storeAddress: store?.address,
          store: undefined,
        }
      }
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
  } catch (error) {
    console.error('[Receipt] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load receipt', details: message },
      { status: 500 }
    )
  }
}
