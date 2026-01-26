import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receiptId = params.id

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[Receipt] Get error:', error)
      if (isTestMode) {
        // Return mock data for test mode
        return NextResponse.json({
          success: true,
          receipt: getMockReceipt(receiptId),
        })
      }
      throw error
    }

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      receipt,
    })
  } catch (error: any) {
    console.error('[Receipt] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

function getMockReceipt(id: string) {
  return {
    id,
    user_id: 'test-user-id',
    image_url: null,
    ocr_status: 'complete',
    ocr_result: {
      storeName: 'Kroger',
      storeAddress: '123 Main St, Cincinnati, OH 45202',
      items: [
        { name: 'Milk 2%', quantity: 1, price: 3.49 },
        { name: 'Eggs Large', quantity: 1, price: 4.29 },
        { name: 'Bread Whole Wheat', quantity: 1, price: 2.99 },
        { name: 'Bananas', quantity: 1, price: 1.49 },
      ],
      subtotal: 12.26,
      tax: 0.74,
      total: 13.00,
      purchaseDate: new Date().toISOString().split('T')[0],
      confidence: 0.92,
    },
    ocr_confidence: 0.92,
    total_amount: 13.00,
    tax_amount: 0.74,
    purchase_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  }
}
