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
   * Extract structured data from receipt image using GPT-4 Vision
   */
  async scanReceipt(imageBase64: string): Promise<{
    store: {
      name: string
      address?: string
    }
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    total: number
    tax?: number
    purchaseDate?: string
    confidence: number
  }> {
    const apiKey = await this.getApiKey()

    const prompt = `Extract all information from this grocery receipt image.

Return JSON with this exact structure:
{
  "store": {
    "name": "Store Name",
    "address": "Full Address"
  },
  "items": [
    {
      "name": "Product Name",
      "price": 5.99,
      "quantity": 1
    }
  ],
  "total": 87.43,
  "tax": 7.24,
  "purchaseDate": "2025-11-22T14:30:00Z",
  "confidence": 0.95
}

Rules:
- Extract ALL items visible on receipt
- Use format XX.XX for prices (always 2 decimals)
- Parse date/time to ISO 8601 format
- If text is unclear, mark confidence lower
- Return valid JSON only`

    const startTime = Date.now()
    
    try {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-4-vision-preview',
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
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
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
        model_name: 'gpt-4-vision',
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
        model_name: 'gpt-4-vision',
        use_case: 'receipt_ocr',
        accuracy_score: result.confidence,
      })

      return result
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      // Track failed usage
      await aiTracker.trackUsage({
        model_name: 'gpt-4-vision',
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

      console.error('OpenAI API error:', error)
      throw new Error('Failed to scan receipt')
    }
  }
}

export const openaiClient = new OpenAIClient()

