import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/auth/ensure-user'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import { uploadReceiptImage } from '@/lib/storage/receipts'
import { extractPricesFromReceipt } from '@/lib/services/price-extractor'

export async function POST(request: NextRequest) {
  try {
    // Auth: try Supabase first, fall back to Firebase headers
    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null

    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email || null
        userName = user.user_metadata?.full_name || null
      }
    } catch (authError) {
      console.error('[ReceiptScan] Supabase auth failed (trying Firebase):', authError)
    }

    if (!userId) {
      userId = request.headers.get('x-user-id')
      userEmail = request.headers.get('x-user-email')
      userName = request.headers.get('x-user-name')
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserExists(userId, userEmail, userName)

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Upload receipt image to storage
    let imageUrl: string | null = null
    const uploadResult = await uploadReceiptImage(userId, buffer, mimeType)
    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url
      console.log('[ReceiptScan] Image uploaded:', imageUrl)
    } else {
      console.warn('[ReceiptScan] Image upload failed (continuing):', uploadResult.error)
    }

    // Create receipt record using service role client
    const dbClient = createServiceRoleClient() as any

    const { data: receipt, error: receiptError } = await dbClient
      .from('receipts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        ocr_status: 'processing',
      })
      .select()
      .single()

    if (receiptError || !receipt) {
      console.error('[ReceiptScan] Failed to create receipt:', receiptError)
      return NextResponse.json(
        { error: 'Failed to create receipt record', details: receiptError?.message },
        { status: 500 }
      )
    }

    // Process receipt with vision model (async — don't block response)
    llmOrchestrator.scanReceipt(base64, mimeType)
      .then(async (llmResponse) => {
        const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/)?.[0]
        if (!jsonMatch) throw new Error('No JSON found in OCR response')
        return JSON.parse(jsonMatch)
      })
      .then(async (result) => {
        try {
          // Update receipt with OCR results
          await dbClient
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

          console.log('[ReceiptScan] Price extraction:', {
            success: extractionResult.success,
            store: extractionResult.storeName,
            productsProcessed: extractionResult.productsProcessed,
            pricesUpdated: extractionResult.pricesUpdated,
          })

          if (extractionResult.storeId) {
            await dbClient
              .from('receipts')
              .update({ store_id: extractionResult.storeId })
              .eq('id', receipt.id)
          }
        } catch (updateError) {
          console.error('[ReceiptScan] Failed to update receipt after OCR:', updateError)
        }
      })
      .catch(async (error) => {
        const errorMsg = error instanceof Error ? error.message : 'Unknown OCR error'
        console.error('[ReceiptScan] OCR error:', errorMsg)
        try {
          await dbClient
            .from('receipts')
            .update({
              ocr_status: 'failed',
              ocr_result: { error: errorMsg },
            })
            .eq('id', receipt.id)
        } catch (updateError) {
          console.error('[ReceiptScan] Failed to update receipt status:', updateError)
        }
      })

    return NextResponse.json({
      receiptId: receipt.id,
      status: 'processing',
      estimatedTime: 5,
      imageUrl: imageUrl || undefined,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to scan receipt'
    console.error('[ReceiptScan] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
