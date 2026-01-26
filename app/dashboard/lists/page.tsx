'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ListItem {
  id: string
  user_input: string
  quantity: number
  unit?: string
}

interface ShoppingList {
  id: string
  name: string
  created_at: string
  list_items: ListItem[] | { count: number }[]
}

interface ListDetailModal {
  isOpen: boolean
  list: ShoppingList | null
  items: ListItem[]
  loading: boolean
}

export default function ListsPage() {
  const router = useRouter()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ListDetailModal>({
    isOpen: false,
    list: null,
    items: [],
    loading: false
  })

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const openListModal = async (list: ShoppingList) => {
    setModal({
      isOpen: true,
      list,
      items: [],
      loading: true
    })

    try {
      const response = await fetch(`/api/lists/${list.id}`)
      if (response.ok) {
        const data = await response.json()
        setModal(prev => ({
          ...prev,
          items: data.list?.list_items || [],
          loading: false
        }))
      }
    } catch (error) {
      console.error('Failed to fetch list items:', error)
      setModal(prev => ({ ...prev, loading: false }))
    }
  }

  const closeModal = () => {
    setModal({
      isOpen: false,
      list: null,
      items: [],
      loading: false
    })
  }

  const handleComparePrices = () => {
    if (modal.list) {
      router.push(`/dashboard/compare?listId=${modal.list.id}`)
    }
  }

  const getItemCount = (list: ShoppingList) => {
    if (Array.isArray(list.list_items) && list.list_items.length > 0) {
      const firstItem = list.list_items[0]
      if ('count' in firstItem) {
        return firstItem.count
      }
      return list.list_items.length
    }
    return 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading lists...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>My Shopping Lists</h1>
        <Link href="/dashboard/lists/new" className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
          + New List
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {lists.length > 0 ? (
          lists.map((list) => (
            <div key={list.id} className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{list.name}</h3>
              <div className="mb-6" style={{ color: 'var(--text-muted)' }}>
                {getItemCount(list)} items
              </div>
              <button
                onClick={() => openListModal(list)}
                className="block w-full py-3 text-center rounded-lg transition hover:border-green-500 hover:text-green-500"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Compare Prices
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No shopping lists yet. Create your first list to start comparing prices!
          </div>
        )}
      </div>

      {/* List Items Preview Modal */}
      {modal.isOpen && modal.list && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{modal.list.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{modal.items.length} items</p>
              </div>
              <button
                onClick={closeModal}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {modal.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
                </div>
              ) : modal.items.length > 0 ? (
                <div className="space-y-2">
                  {modal.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-green-500 font-semibold min-w-[3rem]">
                          {item.quantity > 1 ? `${item.quantity}x` : '1x'}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{item.user_input}</span>
                      </div>
                      {item.unit && (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.unit}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No items in this list
                </div>
              )}
            </div>

            <div className="p-6 flex gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-lg hover:opacity-80 transition"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleComparePrices}
                disabled={modal.items.length === 0}
                className="flex-1 px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Compare Prices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
