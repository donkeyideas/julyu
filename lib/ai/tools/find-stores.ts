/**
 * Find Stores Tool
 * Lets the AI search for nearby stores.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ActionResult, ActionTool } from './types'

interface StoreRow {
  id: string
  retailer: string
  name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

async function execute(
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const supabase = createServiceRoleClient()

  const retailer = params.retailer as string | undefined
  const city = params.city as string | undefined
  const zip = params.zip as string | undefined
  const maxResults = (params.maxResults as number) ?? 10

  let query = supabase
    .from('stores')
    .select('id, retailer, name, address, city, state, zip')

  if (retailer) {
    query = query.ilike('retailer', `%${retailer}%`)
  }
  if (city) {
    query = query.ilike('city', `%${city}%`)
  }
  if (zip) {
    query = query.eq('zip', zip)
  }

  const { data: stores } = await query.limit(maxResults)

  const storeRows: StoreRow[] = (stores ?? []) as StoreRow[]

  if (storeRows.length === 0) {
    let searchDesc = 'stores'
    if (retailer) searchDesc = `${retailer} stores`
    if (city) searchDesc += ` in ${city}`
    if (zip) searchDesc += ` near ${zip}`
    return {
      success: true,
      action: 'FIND_STORES',
      message: `No ${searchDesc} found.`,
      data: { stores: [] },
    }
  }

  // Build message
  let message = `Found ${storeRows.length} store(s):\n`
  for (const s of storeRows) {
    const name = s.name || s.retailer
    const location = [s.address, s.city, s.state, s.zip].filter(Boolean).join(', ')
    message += `\n• ${name}${location ? ` — ${location}` : ''}`
  }

  return {
    success: true,
    action: 'FIND_STORES',
    message,
    data: {
      stores: storeRows.map(s => ({
        id: s.id,
        name: s.name || s.retailer,
        retailer: s.retailer,
        address: s.address,
        city: s.city,
        state: s.state,
        zip: s.zip,
      })),
    },
  }
}

export const findStoresTool: ActionTool = {
  action: 'FIND_STORES',
  description: 'Search for stores by retailer, city, or zip code',
  execute,
}
