/**
 * Set Alert Tool
 * Lets the AI create price alerts for products.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ActionResult, ActionTool } from './types'

async function execute(
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const supabase = createServiceRoleClient()

  const productName = params.product as string
  const targetPrice = params.targetPrice as number

  if (!productName) {
    return { success: false, action: 'SET_ALERT', message: 'No product name provided.' }
  }
  if (!targetPrice || targetPrice <= 0) {
    return { success: false, action: 'SET_ALERT', message: 'Invalid target price.' }
  }

  // Try to find the product in the database
  let productId: string | null = null
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', `%${productName}%`)
    .limit(1)

  if (products && products.length > 0) {
    productId = (products[0] as { id: string }).id
  }

  // Create the price alert
  const { error: alertError } = await supabase
    .from('price_alerts')
    .insert({
      user_id: userId,
      product_id: productId,
      target_price: targetPrice,
      is_active: true,
    })

  if (alertError) {
    return {
      success: false,
      action: 'SET_ALERT',
      message: `Failed to create price alert for "${productName}".`,
    }
  }

  return {
    success: true,
    action: 'SET_ALERT',
    message: `Price alert set for "${productName}" at $${targetPrice.toFixed(2)}.${productId ? '' : ' Note: Product not found in database — alert will activate when the product is added.'}`,
    data: { productName, targetPrice, productId },
  }
}

export const setAlertTool: ActionTool = {
  action: 'SET_ALERT',
  description: 'Set a price alert for a product',
  execute,
}
