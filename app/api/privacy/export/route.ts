/**
 * POST /api/privacy/export — Export all user data as Excel (GDPR right of access)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { exportUserData } from '@/lib/privacy/data-export'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await exportUserData(userId)

    // Build Excel workbook with one sheet per data category
    const wb = XLSX.utils.book_new()

    // Profile sheet (single row)
    if (data.profile) {
      const ws = XLSX.utils.json_to_sheet([data.profile])
      XLSX.utils.book_append_sheet(wb, ws, 'Profile')
    }

    // Preferences sheet (single row)
    if (data.preferences) {
      const ws = XLSX.utils.json_to_sheet([data.preferences])
      XLSX.utils.book_append_sheet(wb, ws, 'Preferences')
    }

    // Array data sheets
    const sheets: Array<{ name: string; data: Array<Record<string, unknown>> }> = [
      { name: 'Consent', data: data.consent },
      { name: 'Receipts', data: data.receipts },
      { name: 'Receipt Items', data: data.receiptItems },
      { name: 'Shopping Lists', data: data.shoppingLists },
      { name: 'List Items', data: data.listItems },
      { name: 'Price Alerts', data: data.priceAlerts },
      { name: 'Budgets', data: data.budgets },
      { name: 'Savings', data: data.savings },
      { name: 'Conversations', data: data.conversations },
      { name: 'Messages', data: data.conversationMessages },
      { name: 'Meal Plans', data: data.mealPlans },
      { name: 'Events', data: data.events },
      { name: 'AI Feedback', data: data.aiFeedback },
      { name: 'Friends', data: data.friends },
      { name: 'Notifications', data: data.notifications },
    ]

    for (const sheet of sheets) {
      if (sheet.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheet.data)
        XLSX.utils.book_append_sheet(wb, ws, sheet.name)
      }
    }

    // If workbook is empty, add an info sheet
    if (wb.SheetNames.length === 0) {
      const ws = XLSX.utils.json_to_sheet([{ message: 'No data found', exportedAt: data.exportedAt, userId: data.userId }])
      XLSX.utils.book_append_sheet(wb, ws, 'Info')
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="julyu-data-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('[Privacy/Export] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    )
  }
}
