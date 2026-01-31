/**
 * Add to List Tool
 * Lets the AI add items to a user's shopping list.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ActionResult, ActionTool } from './types'

async function execute(
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const supabase = createServiceRoleClient() as any

  const itemName = params.item as string
  const quantity = (params.quantity as number) ?? 1
  const listId = params.listId as string | undefined
  const listName = params.listName as string | undefined

  if (!itemName) {
    return { success: false, action: 'ADD_TO_LIST', message: 'No item name provided.' }
  }

  let targetListId = listId

  // If no specific list, find the most recent one or create a new one
  if (!targetListId) {
    const { data: existingLists } = await supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)

    const lists = existingLists ?? []
    if (lists.length > 0) {
      targetListId = (lists[0] as { id: string }).id
    } else {
      // Create a new list
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: userId,
          name: listName || 'Shopping List',
        })
        .select('id')
        .single()

      if (createError || !newList) {
        return {
          success: false,
          action: 'ADD_TO_LIST',
          message: 'Failed to create shopping list.',
        }
      }
      targetListId = newList.id
    }
  }

  // Add item to list
  const { error: insertError } = await supabase
    .from('list_items')
    .insert({
      list_id: targetListId,
      user_input: itemName,
      quantity,
    })

  if (insertError) {
    return {
      success: false,
      action: 'ADD_TO_LIST',
      message: `Failed to add "${itemName}" to your list.`,
    }
  }

  // Update list timestamp
  await supabase
    .from('shopping_lists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', targetListId)

  return {
    success: true,
    action: 'ADD_TO_LIST',
    message: `Added "${itemName}" (qty: ${quantity}) to your shopping list.`,
    data: { listId: targetListId, item: itemName, quantity },
  }
}

export const addToListTool: ActionTool = {
  action: 'ADD_TO_LIST',
  description: 'Add an item to the user\'s shopping list',
  execute,
}
