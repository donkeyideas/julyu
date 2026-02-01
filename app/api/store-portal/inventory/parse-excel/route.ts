import { NextRequest, NextResponse } from 'next/server'
import { getStoreOwnerAnyStatus } from '@/lib/auth/store-portal-auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { storeOwner, error: authError } = await getStoreOwnerAnyStatus()
    if (authError || !storeOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file as array buffer
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'Excel file has no sheets' }, { status: 400 })
    }

    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return NextResponse.json({ error: 'File must have a header row and at least one data row' }, { status: 400 })
    }

    // Parse header to find column indices
    const headers = (data[0] || []).map((h: any) => String(h || '').toLowerCase().trim())

    const nameIdx = headers.findIndex((h: string) => h.includes('name') || h.includes('product'))
    const brandIdx = headers.findIndex((h: string) => h.includes('brand'))
    const sizeIdx = headers.findIndex((h: string) => h.includes('size'))
    const priceIdx = headers.findIndex((h: string) => h.includes('price'))
    const stockIdx = headers.findIndex((h: string) => h.includes('stock') || h.includes('quantity') || h.includes('qty'))
    const categoryIdx = headers.findIndex((h: string) => h.includes('category'))
    const descIdx = headers.findIndex((h: string) => h.includes('description') || h.includes('desc'))

    if (nameIdx === -1) {
      return NextResponse.json({ error: 'File must have a "Product Name" column' }, { status: 400 })
    }
    if (priceIdx === -1) {
      return NextResponse.json({ error: 'File must have a "Price" column' }, { status: 400 })
    }

    const items: any[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0 || row.every((cell: any) => !cell)) continue

      const name = String(row[nameIdx] || '').trim()
      const priceRaw = row[priceIdx]
      const priceStr = String(priceRaw || '0').replace(/[$,]/g, '')
      const stockRaw = stockIdx !== -1 ? row[stockIdx] : 0
      const stockStr = String(stockRaw || '0')

      const price = parseFloat(priceStr)
      const stock = parseInt(stockStr, 10)

      const item: any = {
        name,
        brand: brandIdx !== -1 ? String(row[brandIdx] || '').trim() || undefined : undefined,
        size: sizeIdx !== -1 ? String(row[sizeIdx] || '').trim() || undefined : undefined,
        price: isNaN(price) ? 0 : price,
        stock_quantity: isNaN(stock) ? 0 : stock,
        category: categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() || undefined : undefined,
        description: descIdx !== -1 ? String(row[descIdx] || '').trim() || undefined : undefined,
      }

      // Validate
      if (!item.name) {
        item.error = 'Missing product name'
      } else if (item.price <= 0) {
        item.error = 'Invalid price'
      }

      items.push(item)
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Excel parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    )
  }
}
