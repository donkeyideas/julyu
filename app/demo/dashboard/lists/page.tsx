'use client'

import { useState } from 'react'

// Inline mock data
function daysAgoLabel(days: number): string {
  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days === 7) return 'Updated 1 week ago'
  return `Updated ${Math.floor(days / 7)} weeks ago`
}

interface ListItem {
  name: string
  checked: boolean
}

interface ShoppingList {
  id: string
  name: string
  daysAgo: number
  items: ListItem[]
}

const INITIAL_LISTS: ShoppingList[] = [
  {
    id: 'list-1',
    name: 'Weekly Groceries',
    daysAgo: 0,
    items: [
      { name: 'Whole Milk (1 gal)', checked: true },
      { name: 'Large Eggs (dozen)', checked: true },
      { name: 'Bananas (1 bunch)', checked: false },
      { name: 'Chicken Breast (2 lb)', checked: false },
      { name: 'Baby Spinach (5 oz)', checked: false },
      { name: 'Whole Wheat Bread', checked: true },
      { name: 'Greek Yogurt (32 oz)', checked: false },
      { name: 'Apples (3 lb bag)', checked: false },
      { name: 'Cheddar Cheese (8 oz)', checked: true },
      { name: 'Pasta Sauce (24 oz)', checked: false },
      { name: 'Ground Turkey (1 lb)', checked: false },
      { name: 'Brown Rice (2 lb)', checked: false },
    ],
  },
  {
    id: 'list-2',
    name: 'BBQ Party',
    daysAgo: 3,
    items: [
      { name: 'Ground Beef 80/20 (3 lb)', checked: false },
      { name: 'Hot Dogs (8 ct)', checked: false },
      { name: 'Hamburger Buns (8 ct)', checked: false },
      { name: 'Ketchup & Mustard', checked: true },
      { name: 'Potato Chips (party size)', checked: false },
      { name: 'Cole Slaw Mix', checked: false },
      { name: 'Corn on the Cob (8 ct)', checked: false },
      { name: 'Lemonade (gallon)', checked: true },
    ],
  },
  {
    id: 'list-3',
    name: 'Healthy Meal Prep',
    daysAgo: 7,
    items: [
      { name: 'Chicken Breast (3 lb)', checked: false },
      { name: 'Salmon Fillet (1 lb)', checked: false },
      { name: 'Brown Rice (2 lb)', checked: true },
      { name: 'Quinoa (16 oz)', checked: false },
      { name: 'Broccoli Crowns (1 lb)', checked: false },
      { name: 'Sweet Potatoes (3 lb)', checked: false },
      { name: 'Baby Spinach (10 oz)', checked: false },
      { name: 'Bell Peppers (3 ct)', checked: false },
      { name: 'Avocados (4 ct)', checked: true },
      { name: 'Cherry Tomatoes (pint)', checked: false },
      { name: 'Olive Oil (17 oz)', checked: true },
      { name: 'Lemons (4 ct)', checked: false },
      { name: 'Garlic (3 head)', checked: false },
      { name: 'Ginger (1 piece)', checked: false },
      { name: 'Soy Sauce (15 oz)', checked: true },
    ],
  },
  {
    id: 'list-4',
    name: 'Baby Essentials',
    daysAgo: 14,
    items: [
      { name: 'Baby Formula (22 oz)', checked: false },
      { name: 'Diapers Size 2 (84 ct)', checked: false },
      { name: 'Baby Wipes (3 pack)', checked: true },
      { name: 'Baby Food - Bananas (4 oz)', checked: false },
      { name: 'Baby Cereal (8 oz)', checked: false },
      { name: 'Baby Shampoo (13.6 oz)', checked: true },
    ],
  },
]

export default function DemoListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>(INITIAL_LISTS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleItem = (listId: string, itemIndex: number) => {
    setLists(prev =>
      prev.map(list => {
        if (list.id !== listId) return list
        const newItems = [...list.items]
        newItems[itemIndex] = { ...newItems[itemIndex], checked: !newItems[itemIndex].checked }
        return { ...list, items: newItems }
      })
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>My Lists</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Organize your shopping with custom lists
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition hover:opacity-90"
          style={{ backgroundColor: '#22c55e' }}
        >
          + Create New List
        </button>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map(list => {
          const checkedCount = list.items.filter(i => i.checked).length
          const totalCount = list.items.length
          const progressPct = Math.round((checkedCount / totalCount) * 100)
          const isExpanded = expandedId === list.id

          return (
            <div
              key={list.id}
              className="rounded-xl overflow-hidden transition"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {/* Card Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : list.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {list.name}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {totalCount} items &middot; {daysAgoLabel(list.daysAgo)}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: '#22c55e' }}
                    />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {checkedCount}/{totalCount}
                  </span>
                </div>
              </div>

              {/* Expanded Items */}
              {isExpanded && (
                <div className="px-6 pb-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="pt-4 space-y-2">
                    {list.items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition hover:opacity-80"
                        style={{ backgroundColor: item.checked ? 'rgba(34,197,94,0.08)' : 'transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(list.id, idx)}
                          className="w-4 h-4 rounded accent-green-500"
                        />
                        <span
                          className={`text-sm ${item.checked ? 'line-through' : ''}`}
                          style={{ color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                          {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
