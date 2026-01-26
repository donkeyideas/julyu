/**
 * Translation Service
 * Uses DeepSeek for fast, cost-effective translations
 */

import { deepseekClient } from '@/lib/api/deepseek'

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  success: boolean
  error?: string
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tieng Viet' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
]

class TranslationService {
  /**
   * Translate text from one language to another
   */
  async translate(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<TranslationResult> {
    try {
      if (!text?.trim()) {
        return {
          originalText: text,
          translatedText: text,
          sourceLang: sourceLang || 'unknown',
          targetLang,
          success: true,
        }
      }

      // If source and target are the same, return original
      if (sourceLang === targetLang) {
        return {
          originalText: text,
          translatedText: text,
          sourceLang,
          targetLang,
          success: true,
        }
      }

      const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang
      const sourceLangName = sourceLang
        ? SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang
        : 'auto-detect'

      const prompt = sourceLang
        ? `Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, nothing else:\n\n${text}`
        : `Translate the following text to ${targetLangName}. Only return the translated text, nothing else:\n\n${text}`

      const response = await deepseekClient.chat([
        { role: 'system', content: 'You are a professional translator. Translate accurately while preserving the tone and meaning. Only output the translation, no explanations.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3, // Low temperature for consistent translations
        maxTokens: 1000,
      })

      return {
        originalText: text,
        translatedText: response.content.trim(),
        sourceLang: sourceLang || 'auto',
        targetLang,
        success: true,
      }
    } catch (error: any) {
      console.error('[Translation] Error:', error)
      return {
        originalText: text,
        translatedText: text, // Return original on error
        sourceLang: sourceLang || 'unknown',
        targetLang,
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Detect the language of a text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      if (!text?.trim()) return 'en'

      const response = await deepseekClient.chat([
        { role: 'system', content: 'You are a language detection system. Respond with only the ISO 639-1 language code (e.g., en, es, fr, zh, ja). Nothing else.' },
        { role: 'user', content: `Detect the language of this text: "${text.substring(0, 200)}"` }
      ], {
        temperature: 0,
        maxTokens: 10,
      })

      const detected = response.content.trim().toLowerCase().substring(0, 2)
      // Validate it's a known language code
      if (SUPPORTED_LANGUAGES.some(l => l.code === detected)) {
        return detected
      }
      return 'en' // Default to English
    } catch (error) {
      console.error('[Translation] Language detection error:', error)
      return 'en'
    }
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang?: string
  ): Promise<TranslationResult[]> {
    // Translate sequentially to avoid rate limits
    const results: TranslationResult[] = []
    for (const text of texts) {
      const result = await this.translate(text, targetLang, sourceLang)
      results.push(result)
    }
    return results
  }
}

export const translationService = new TranslationService()
