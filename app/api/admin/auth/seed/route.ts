import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Seed endpoint is permanently disabled for security
// Admin accounts must be created through the Employees page by existing admins

export async function POST() {
  return NextResponse.json(
    { error: 'Seed endpoint is disabled' },
    { status: 403 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'Seed endpoint is disabled' },
    { status: 403 }
  )
}
