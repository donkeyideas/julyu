import { NextRequest, NextResponse } from 'next/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import { llmOrchestrator } from '@/lib/llm/orchestrator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()

    if (authError || !storeOwner) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 10MB' }, { status: 400 })
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Process receipt with vision model
    const llmResponse = await llmOrchestrator.scanReceipt(base64, mimeType)

    // Extract JSON from response
    const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonMatch) {
      throw new Error('Failed to extract product data from receipt')
    }

    const result = JSON.parse(jsonMatch)

    // Transform OCR result to inventory format
    const items = result.items?.map((item: any) => ({
      name: item.name || item.item || 'Unknown Product',
      brand: item.brand || null,
      size: item.size || item.quantity_info || null,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
    })) || []

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No products found in receipt' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      items,
      metadata: {
        total: result.total || null,
        tax: result.tax || null,
        store: result.store_name || null,
        date: result.date || null,
        confidence: result.confidence || null,
      },
    })

  } catch (error) {
    console.error('Import receipt error:', error)

    if (error instanceof Error && error.message.includes('extract')) {
      return NextResponse.json(
        { error: 'Could not read receipt clearly. Please try again with a clearer image.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}
