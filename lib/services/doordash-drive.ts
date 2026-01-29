/**
 * DoorDash Drive API Integration
 * Handles delivery creation, quotes, and tracking
 */

interface DoorDashConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
}

interface DeliveryAddress {
  street: string
  city: string
  state: string
  zipCode: string
  instructions?: string
}

interface DeliveryQuote {
  external_delivery_id: string
  pickup_address: string
  dropoff_address: string
  order_value: number // in cents
}

interface DeliveryRequest {
  external_delivery_id: string
  pickup_address: string
  pickup_business_name: string
  pickup_phone_number: string
  pickup_instructions?: string
  dropoff_address: string
  dropoff_business_name: string
  dropoff_phone_number: string
  dropoff_instructions?: string
  order_value: number // in cents
  items?: Array<{
    name: string
    description?: string
    quantity: number
    external_id?: string
  }>
  pickup_time?: string // ISO 8601 format
  dropoff_time?: string // ISO 8601 format
  tip?: number // in cents
  contactless_dropoff?: boolean
  action_if_undeliverable?: 'return_to_pickup' | 'dispose'
}

interface DeliveryResponse {
  delivery_id: string
  external_delivery_id: string
  status: string
  tracking_url: string
  fee: number
  estimated_pickup_time: string
  estimated_dropoff_time: string
  dasher?: {
    name: string
    phone_number: string
    vehicle_make: string
    vehicle_model: string
    location?: {
      lat: number
      lng: number
    }
  }
}

interface QuoteResponse {
  fee: number
  currency: string
  estimated_pickup_time: string
  estimated_dropoff_time: string
  expires_at: string
}

export class DoorDashDriveService {
  private config: DoorDashConfig
  private baseUrl: string

  constructor(config: DoorDashConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production'
      ? 'https://openapi.doordash.com/drive/v2'
      : 'https://openapi.doordash.com/drive/v2' // Same for both
  }

  /**
   * Get delivery quote
   */
  async getDeliveryQuote(quote: DeliveryQuote): Promise<QuoteResponse> {
    const response = await fetch(`${this.baseUrl}/quotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quote),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DoorDash quote error: ${error.message || 'Failed to get quote'}`)
    }

    return await response.json()
  }

  /**
   * Create delivery
   */
  async createDelivery(delivery: DeliveryRequest): Promise<DeliveryResponse> {
    const response = await fetch(`${this.baseUrl}/deliveries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(delivery),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DoorDash delivery error: ${error.message || 'Failed to create delivery'}`)
    }

    return await response.json()
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(deliveryId: string): Promise<DeliveryResponse> {
    const response = await fetch(`${this.baseUrl}/deliveries/${deliveryId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DoorDash status error: ${error.message || 'Failed to get status'}`)
    }

    return await response.json()
  }

  /**
   * Cancel delivery
   */
  async cancelDelivery(deliveryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/deliveries/${deliveryId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DoorDash cancel error: ${error.message || 'Failed to cancel'}`)
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string, webhookSecret: string): boolean {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', webhookSecret)
    hmac.update(body)
    const computedSignature = hmac.digest('hex')
    return computedSignature === signature
  }

  /**
   * Format address for DoorDash
   */
  static formatAddress(address: DeliveryAddress): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
  }
}

export default DoorDashDriveService
