import { create } from 'zustand'
import { getLists, getList, createList, deleteList, addItem, updateItem, deleteItem, ShoppingList, ListItem } from '@/services/lists'

interface ListsState {
  lists: ShoppingList[]
  currentList: ShoppingList | null
  currentItems: ListItem[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchLists: () => Promise<void>
  fetchList: (id: string) => Promise<void>
  createNewList: (name: string) => Promise<{ error?: string; list?: ShoppingList }>
  removeList: (id: string) => Promise<{ error?: string }>
  addListItem: (listId: string, item: Partial<ListItem>) => Promise<{ error?: string }>
  updateListItem: (listId: string, itemId: string, updates: Partial<ListItem>) => Promise<{ error?: string }>
  removeListItem: (listId: string, itemId: string) => Promise<{ error?: string }>
  clearError: () => void
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  currentList: null,
  currentItems: [],
  isLoading: false,
  error: null,

  fetchLists: async () => {
    set({ isLoading: true, error: null })
    try {
      const lists = await getLists()
      set({ lists, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch lists',
        isLoading: false,
      })
    }
  },

  fetchList: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await getList(id)
      set({
        currentList: data.list,
        currentItems: data.items || [],
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch list',
        isLoading: false,
      })
    }
  },

  createNewList: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const list = await createList(name)
      set((state) => ({
        lists: [...state.lists, list],
        isLoading: false,
      }))
      return { list }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create list'
      set({ error: errorMessage, isLoading: false })
      return { error: errorMessage }
    }
  },

  removeList: async (id: string) => {
    const previousLists = get().lists

    // Optimistic update: remove from list immediately
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== id),
      error: null,
    }))

    try {
      await deleteList(id)
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete list'
      // Revert on failure
      set({ lists: previousLists, error: errorMessage })
      return { error: errorMessage }
    }
  },

  addListItem: async (listId: string, item: Partial<ListItem>) => {
    set({ isLoading: true, error: null })
    try {
      const newItem = await addItem(listId, item)
      set((state) => ({
        currentItems: [...state.currentItems, newItem],
        isLoading: false,
      }))
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item'
      set({ error: errorMessage, isLoading: false })
      return { error: errorMessage }
    }
  },

  updateListItem: async (listId: string, itemId: string, updates: Partial<ListItem>) => {
    const previousItems = get().currentItems

    // Optimistic update: apply changes immediately
    set((state) => ({
      currentItems: state.currentItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
      error: null,
    }))

    try {
      const updatedItem = await updateItem(listId, itemId, updates)
      set((state) => ({
        currentItems: state.currentItems.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
      }))
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item'
      // Revert on failure
      set({ currentItems: previousItems, error: errorMessage })
      return { error: errorMessage }
    }
  },

  removeListItem: async (listId: string, itemId: string) => {
    const previousItems = get().currentItems

    // Optimistic update: remove item immediately
    set((state) => ({
      currentItems: state.currentItems.filter((item) => item.id !== itemId),
      error: null,
    }))

    try {
      await deleteItem(listId, itemId)
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item'
      // Revert on failure
      set({ currentItems: previousItems, error: errorMessage })
      return { error: errorMessage }
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
