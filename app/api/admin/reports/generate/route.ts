/**
 * POST /api/admin/reports/generate — Generate a B2B market report
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateReport, type ReportConfig } from '@/lib/b2b/report-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config: ReportConfig = {
      title: body.title || 'Market Intelligence Report',
      categories: body.categories,
      region: body.region,
      weeks: body.weeks || 4,
      includePrices: body.includePrices ?? true,
      includeTrends: body.includeTrends ?? true,
      includeCategories: body.includeCategories ?? true,
    }

    const report = await generateReport(config)

    // Return as downloadable markdown if requested
    if (body.download) {
      const filename = `report-${new Date().toISOString().split('T')[0]}.md`
      return new NextResponse(report.content, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('[Reports/Generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}
