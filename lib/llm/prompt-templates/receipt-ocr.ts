/**
 * Receipt OCR Prompt Template
 * Extracts structured data from receipt images using vision models.
 */

import type { PromptTemplate } from '@/types/llm'

export const RECEIPT_OCR_SYSTEM_PROMPT = `You are a receipt OCR specialist. Extract structured data from grocery receipt images with high accuracy.`

export const RECEIPT_OCR_USER_PROMPT = `Extract all information from this grocery receipt image.

Return JSON with this EXACT structure (no nesting for store):
{
  "storeName": "Store Name",
  "storeAddress": "Full Address",
  "items": [
    {
      "name": "Product Name (clean, readable name)",
      "price": 5.99,
      "quantity": 1,
      "category": "dairy|produce|meat|bakery|snacks|beverages|pantry|frozen|household|other",
      "discount": 0.00
    }
  ],
  "subtotal": 80.19,
  "total": 87.43,
  "tax": 7.24,
  "purchaseDate": "2025-11-22",
  "paymentMethod": "credit|debit|cash|ebt|other",
  "confidence": 0.95
}

Rules:
- Extract ALL items visible on receipt
- Clean up item names (remove codes, abbreviations — make them readable)
- Use format XX.XX for prices (always 2 decimals)
- Parse date to YYYY-MM-DD format
- If text is unclear, mark confidence lower (0.0 to 1.0)
- Ignore savings/discount lines that are not actual items
- Capture any discounts/coupons as negative discount values on the relevant item
- Return valid JSON only, no markdown formatting`

export const receiptOCRTemplate: PromptTemplate = {
  id: 'receipt-ocr',
  taskType: 'receipt_ocr',
  systemPrompt: RECEIPT_OCR_SYSTEM_PROMPT,
  buildUserPrompt: () => RECEIPT_OCR_USER_PROMPT,
  defaultOptions: {
    temperature: 0.1,
    maxTokens: 4000,
    timeout: 60000,
  },
}
