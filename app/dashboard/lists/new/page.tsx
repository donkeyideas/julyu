'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParsedItem {
  name: string
  quantity: number
  unit: string | null
}

export default function NewListPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [itemsText, setItemsText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Parse natural language input into structured items
  const parseItems = (text: string): ParsedItem[] => {
    if (!text.trim()) return []

    // Split by common delimiters: newlines, commas, semicolons
    const lines = text.split(/[\n,;]+/).map(line => line.trim()).filter(Boolean)

    return lines.map(line => {
      // Try to extract quantity and unit
      // Patterns: "2 gallons milk", "3x eggs", "milk 2%", "2 dozen eggs"
      const quantityMatch = line.match(/^(\d+(?:\.\d+)?)\s*(?:x|X)?\s*(.+)/)
      const unitMatch = line.match(/^(\d+(?:\.\d+)?)\s*(gallon|gal|lb|lbs|pound|pounds|oz|ounce|ounces|dozen|doz|pack|packs|box|boxes|bag|bags|can|cans|bottle|bottles|jar|jars|carton|cartons)s?\s+(.+)/i)

      if (unitMatch) {
        return {
          name: unitMatch[3].trim(),
          quantity: parseFloat(unitMatch[1]),
          unit: unitMatch[2].toLowerCase(),
        }
      } else if (quantityMatch) {
        return {
          name: quantityMatch[2].trim(),
          quantity: parseFloat(quantityMatch[1]),
          unit: null,
        }
      }

      return {
        name: line,
        quantity: 1,
        unit: null,
      }
    })
  }

  const handleItemsChange = (text: string) => {
    setItemsText(text)
    setParsedItems(parseItems(text))
  }

  const removeItem = (index: number) => {
    const newItems = [...parsedItems]
    newItems.splice(index, 1)
    setParsedItems(newItems)
    // Reconstruct text from remaining items
    const newText = newItems.map(item => {
      if (item.quantity > 1) {
        if (item.unit) {
          return `${item.quantity} ${item.unit} ${item.name}`
        }
        return `${item.quantity} ${item.name}`
      }
      return item.name
    }).join('\n')
    setItemsText(newText)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter a list name')
      return
    }

    if (parsedItems.length === 0) {
      setError('Please add at least one item to your list')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          items: parsedItems.map(item => ({
            user_input: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create list')
      }

      // Redirect to compare prices with the new list
      router.push(`/dashboard/compare?listId=${data.list.id}`)
    } catch (err: any) {
      console.error('Error creating list:', err)
      setError(err.message || 'Failed to create list')
    } finally {
      setSaving(false)
    }
  }

  const handleCompareNow = async () => {
    if (parsedItems.length === 0) {
      setError('Please add at least one item to compare')
      return
    }

    // If no name, create a default one
    const listName = name.trim() || `Shopping List ${new Date().toLocaleDateString()}`
    setName(listName)

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          items: parsedItems.map(item => ({
            user_input: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create list')
      }

      router.push(`/dashboard/compare?listId=${data.list.id}`)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to compare prices')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/lists" className="text-green-500 hover:underline flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Lists
        </Link>
      </div>

      <h1 className="text-4xl font-black mb-2">New Shopping List</h1>
      <p className="text-gray-500 mb-8">Add items naturally - we&apos;ll parse quantities and units automatically</p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">List Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Groceries, Party Supplies"
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Items
              <span className="text-gray-600 ml-2 font-normal">
                (one per line, or comma-separated)
              </span>
            </label>
            <textarea
              value={itemsText}
              onChange={(e) => handleItemsChange(e.target.value)}
              placeholder="Examples:
2 gallons milk
1 dozen eggs
organic bananas
whole wheat bread
3 cans tomato sauce
chicken breast 2 lbs"
              rows={8}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              Tip: Include quantities like &quot;2 gallons&quot;, &quot;3 lbs&quot;, &quot;1 dozen&quot; for better organization
            </p>
          </div>

          {/* Preview parsed items */}
          {parsedItems.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Preview ({parsedItems.length} items)
              </label>
              <div className="bg-black/50 rounded-lg border border-gray-800 divide-y divide-gray-800">
                {parsedItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-500 font-semibold min-w-[3rem]">
                        {item.quantity}{item.unit ? ` ${item.unit}` : 'x'}
                      </span>
                      <span className="text-white">{item.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-gray-500 hover:text-red-500 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save List'}
          </button>
          <button
            type="button"
            onClick={handleCompareNow}
            disabled={saving || parsedItems.length === 0}
            className="flex-1 px-6 py-4 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              'Processing...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Compare Prices
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick templates */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4 text-gray-400">Quick Start Templates</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              name: 'Basic Groceries',
              items: 'milk 2%\neggs\nbread\nbananas\napples\nchicken breast\nrice\npasta',
            },
            {
              name: 'BBQ Party',
              items: 'hamburger buns\nground beef 3 lbs\nhot dogs\nhot dog buns\nketchup\nmustard\nchips\nsoda 2 liters',
            },
            {
              name: 'Healthy Breakfast',
              items: 'greek yogurt\ngranola\nblueberries\nstrawberries\nalmond milk\noatmeal\nhoney',
            },
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => {
                setName(template.name)
                handleItemsChange(template.items)
              }}
              className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-left hover:border-green-500/50 transition"
            >
              <div className="font-semibold text-white mb-1">{template.name}</div>
              <div className="text-sm text-gray-500">
                {template.items.split('\n').length} items
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
