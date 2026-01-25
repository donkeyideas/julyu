import { NextResponse } from 'next/server'
import { spoonacularClient } from '@/lib/api/spoonacular'

/**
 * Test Spoonacular API connection
 * GET /api/spoonacular/test
 */
export async function GET() {
  try {
    // Check if configured
    const isConfigured = await spoonacularClient.isConfiguredAsync()

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Spoonacular API not configured',
        message: 'Set SPOONACULAR_API_KEY environment variable or add key in admin dashboard',
      }, { status: 503 })
    }

    // Test by searching for a common product
    const products = await spoonacularClient.searchGroceryProducts('milk', { number: 3 })

    return NextResponse.json({
      success: true,
      message: 'Spoonacular API connection successful',
      productCount: products.length,
      sampleProducts: products.map(p => ({
        name: p.name,
        brand: p.brand,
        price: p.price,
      })),
    })
  } catch (error: any) {
    console.error('[Spoonacular Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to connect to Spoonacular API',
    }, { status: 500 })
  }
}
