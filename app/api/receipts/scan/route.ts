import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { openaiClient } from '@/lib/api/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    if (!user && !isTestMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        image_url: '', // TODO: Upload to R2
        ocr_status: 'processing',
      })
      .select()
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
    }

    // Process receipt with GPT-4 Vision (async - don't await to return quickly)
    // Fire and forget, but handle errors properly
    openaiClient.scanReceipt(base64)
      .then(async (result) => {
        try {
          // Update receipt with OCR results
          await supabase
            .from('receipts')
            .update({
              ocr_status: 'complete',
              ocr_result: result,
              ocr_confidence: result.confidence,
              total_amount: result.total,
              tax_amount: result.tax,
              purchase_date: result.purchaseDate,
              processed_at: new Date().toISOString(),
            })
            .eq('id', receipt.id)

          // TODO: Match items to products and update price database
        } catch (updateError) {
          console.error('Failed to update receipt after OCR:', updateError)
        }
      })
      .catch(async (error) => {
        console.error('OCR error:', error)
        try {
          await supabase
            .from('receipts')
            .update({
              ocr_status: 'failed',
            })
            .eq('id', receipt.id)
        } catch (updateError) {
          console.error('Failed to update receipt status to failed:', updateError)
        }
      })

    return NextResponse.json({
      receiptId: receipt.id,
      status: 'processing',
      estimatedTime: 5,
    })
  } catch (error: any) {
    console.error('Receipt scan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scan receipt' },
      { status: 500 }
    )
  }
}


