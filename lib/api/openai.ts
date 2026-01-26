import axios from 'axios'
import { aiTracker } from '@/lib/ai/tracker'
import { getApiKey } from './config'

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

/**
 * OpenAI GPT-4 Vision Client for Receipt OCR
 */
export class OpenAIClient {
  private apiKey: string | null = null

  private async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey
    
    // Try to get from database or environment
    const key = await getApiKey('gpt-4-vision')
    if (key) {
      this.apiKey = key
      return key
    }
    
    throw new Error('OpenAI API key not configured. Please configure it in Admin → AI Models.')
  }

  /**
   * Extract structured data from receipt image using GPT-4o
   */
  async scanReceipt(imageBase64: string): Promise<{
    storeName: string
    storeAddress?: string
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    subtotal?: number
    total: number
    tax?: number
    purchaseDate?: string
    confidence: number
  }> {
    const apiKey = await this.getApiKey()

    const prompt = `Extract all information from this grocery receipt image.

Return JSON with this EXACT structure (no nesting for store):
{
  "storeName": "Store Name",
  "storeAddress": "Full Address",
  "items": [
    {
      "name": "Product Name (clean, readable name)",
      "price": 5.99,
      "quantity": 1
    }
  ],
  "subtotal": 80.19,
  "total": 87.43,
  "tax": 7.24,
  "purchaseDate": "2025-11-22",
  "confidence": 0.95
}

Rules:
- Extract ALL items visible on receipt
- Clean up item names (remove codes, abbreviations - make them readable)
- Use format XX.XX for prices (always 2 decimals)
- Parse date to YYYY-MM-DD format
- If text is unclear, mark confidence lower (0.0 to 1.0)
- Ignore savings/discount lines that are not actual items
- Return valid JSON only, no markdown formatting`

    const startTime = Date.now()

    try {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
          temperature: 0.1, // Low temperature for consistent extraction
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const responseTime = Date.now() - startTime
      const inputTokens = response.data.usage?.prompt_tokens || 0
      const outputTokens = response.data.usage?.completion_tokens || 0
      const cost = aiTracker.calculateCost('gpt-4-vision', inputTokens, outputTokens)

      const content = response.data.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)?.[0]
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch)

      // Track usage
      await aiTracker.trackUsage({
        model_name: 'gpt-4o',
        provider: 'OpenAI',
        use_case: 'receipt_ocr',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        response_time_ms: responseTime,
        cost,
        request_payload: { imageSize: imageBase64.length },
        response_payload: result,
        success: true,
      })

      // Store training data
      await aiTracker.storeTrainingData({
        input: { imageBase64: imageBase64.substring(0, 100) + '...' }, // Store truncated for privacy
        output: result,
        model_name: 'gpt-4o',
        use_case: 'receipt_ocr',
        accuracy_score: result.confidence,
      })

      return result
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Track failed usage
      await aiTracker.trackUsage({
        model_name: 'gpt-4o',
        provider: 'OpenAI',
        use_case: 'receipt_ocr',
        input_tokens: 0,
        output_tokens: 0,
        response_time_ms: responseTime,
        cost: 0,
        request_payload: { imageSize: imageBase64.length },
        success: false,
        error_message: error.message,
      })

      console.error('OpenAI API error:', error.response?.data || error.message || error)
      throw new Error(error.response?.data?.error?.message || 'Failed to scan receipt')
    }
  }
}

export const openaiClient = new OpenAIClient()

