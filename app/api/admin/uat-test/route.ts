import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// UAT test endpoint is disabled to prevent creating test data
export async function GET() {
  return NextResponse.json(
    { error: 'UAT test endpoint is disabled' },
    { status: 403 }
  )
}
