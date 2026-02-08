import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ configured: false, error: 'Missing environment variables' })
  }

  try {
    new URL(url)
    return NextResponse.json({ configured: true })
  } catch {
    return NextResponse.json({ configured: false, error: 'Invalid URL format' })
  }
}


