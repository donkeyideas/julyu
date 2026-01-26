import { NextRequest, NextResponse } from 'next/server'
import { translationService, SUPPORTED_LANGUAGES } from '@/lib/services/translation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, targetLang, sourceLang } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!targetLang) {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 })
    }

    // Validate target language
    if (!SUPPORTED_LANGUAGES.some(l => l.code === targetLang)) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 })
    }

    const result = await translationService.translate(text, targetLang, sourceLang)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Translate] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return list of supported languages
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES })
}
