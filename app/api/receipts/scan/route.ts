import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { openaiClient } from '@/lib/api/openai'
import { uploadReceiptImage } from '@/lib/storage/receipts'
import { extractPricesFromReceipt } from '@/lib/services/price-extractor'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // In test mode, allow requests even if auth fails
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    // For test mode, create a mock user ID
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Upload receipt image to storage
    let imageUrl = ''
    const uploadResult = await uploadReceiptImage(userId, buffer, file.type)
    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url
      console.log('[ReceiptScan] Image uploaded:', imageUrl)
    } else {
      console.warn('[ReceiptScan] Image upload failed, continuing without storage:', uploadResult.error)
    }

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        ocr_status: 'processing',
      })
      .select()
      .single()

    // If database insert fails, use demo mode
    if (receiptError || !receipt) {
      console.error('[ReceiptScan] Failed to create receipt:', receiptError)

      // Return a demo receipt ID that will trigger demo mode in the GET endpoint
      const demoReceiptId = `demo-receipt-${Date.now()}`
      console.log('[ReceiptScan] Using demo mode with ID:', demoReceiptId)

      return NextResponse.json({
        receiptId: demoReceiptId,
        status: 'processing',
        estimatedTime: 2,
        imageUrl: imageUrl || undefined,
        demoMode: true
      })
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

          // Extract prices and update price database
          console.log('[ReceiptScan] Extracting prices from receipt...')
          const extractionResult = await extractPricesFromReceipt(userId, result)

          console.log('[ReceiptScan] Price extraction complete:', {
            success: extractionResult.success,
            store: extractionResult.storeName,
            productsProcessed: extractionResult.productsProcessed,
            pricesUpdated: extractionResult.pricesUpdated,
            newProductsCreated: extractionResult.newProductsCreated,
            errors: extractionResult.errors.length,
          })

          // Update receipt with extraction results
          await supabase
            .from('receipts')
            .update({
              store_id: extractionResult.storeId || null,
            })
            .eq('id', receipt.id)

        } catch (updateError) {
          console.error('[ReceiptScan] Failed to update receipt after OCR:', updateError)
        }
      })
      .catch(async (error) => {
        console.error('[ReceiptScan] OCR error:', error)
        try {
          await supabase
            .from('receipts')
            .update({
              ocr_status: 'failed',
            })
            .eq('id', receipt.id)
        } catch (updateError) {
          console.error('[ReceiptScan] Failed to update receipt status to failed:', updateError)
        }
      })

    return NextResponse.json({
      receiptId: receipt.id,
      status: 'processing',
      estimatedTime: 5,
      imageUrl: imageUrl || undefined,
    })
  } catch (error: any) {
    console.error('[ReceiptScan] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scan receipt' },
      { status: 500 }
    )
  }
}


