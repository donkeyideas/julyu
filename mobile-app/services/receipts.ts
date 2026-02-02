import { apiClient, uploadFile } from './api'

export interface Receipt {
  id: string
  user_id: string
  store_name: string
  total_amount: number
  savings_amount: number
  items_count: number
  image_url?: string
  scanned_at: string
  created_at: string
}

export interface ScanResult {
  receiptId: string
  status: string
  store_name: string
  total_amount: number
  savings_amount: number
  items_count: number
}

export async function scanReceipt(imageUri: string): Promise<ScanResult> {
  return uploadFile<ScanResult>('/receipts/scan', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  })
}

export async function getReceipts(): Promise<Receipt[]> {
  const response = await apiClient<{ receipts: Receipt[] }>('/receipts')
  return response.receipts
}

export async function getReceipt(id: string): Promise<Receipt> {
  return apiClient<Receipt>(`/receipts/${id}`)
}
