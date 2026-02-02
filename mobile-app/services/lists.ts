import { apiClient } from './api'

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  items_count: number
  estimated_total: number
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  name: string
  quantity: number
  unit?: string
  estimated_price?: number
  checked: boolean
}

export async function getLists(): Promise<ShoppingList[]> {
  const response = await apiClient<{ lists: ShoppingList[] }>('/lists')
  return response.lists
}

export async function getList(id: string): Promise<{ list: ShoppingList; items: ListItem[] }> {
  return apiClient<{ list: ShoppingList; items: ListItem[] }>(`/lists/${id}`)
}

export async function createList(name: string): Promise<ShoppingList> {
  return apiClient<ShoppingList>('/lists', {
    method: 'POST',
    body: { name },
  })
}

export async function deleteList(id: string): Promise<void> {
  await apiClient(`/lists/${id}`, { method: 'DELETE' })
}

export async function addItem(listId: string, item: Partial<ListItem>): Promise<ListItem> {
  return apiClient<ListItem>(`/lists/${listId}/items`, {
    method: 'POST',
    body: item,
  })
}

export async function updateItem(
  listId: string,
  itemId: string,
  updates: Partial<ListItem>
): Promise<ListItem> {
  return apiClient<ListItem>(`/lists/${listId}/items/${itemId}`, {
    method: 'PUT',
    body: updates,
  })
}

export async function deleteItem(listId: string, itemId: string): Promise<void> {
  await apiClient(`/lists/${listId}/items/${itemId}`, { method: 'DELETE' })
}

export async function compareListPrices(
  listId: string
): Promise<{ stores: any[]; best_store: any; potential_savings: number }> {
  return apiClient(`/lists/${listId}/compare`)
}
