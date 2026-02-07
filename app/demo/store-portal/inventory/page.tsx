'use client'

import { useState } from 'react'

interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

const initialProducts: Product[] = [
  { id: 1, name: 'Arizona Iced Tea - Green Tea', sku: 'SKU-001', category: 'Beverages', price: 1.29, stock: 48, status: 'in-stock' },
  { id: 2, name: 'Takis Fuego Hot Chili Pepper', sku: 'SKU-002', category: 'Snacks', price: 3.49, stock: 32, status: 'in-stock' },
  { id: 3, name: 'Goya Black Beans 15.5oz', sku: 'SKU-003', category: 'Canned Goods', price: 1.49, stock: 67, status: 'in-stock' },
  { id: 4, name: 'Bodega Special Sandwich', sku: 'SKU-004', category: 'Deli', price: 6.99, stock: 12, status: 'in-stock' },
  { id: 5, name: 'Red Bull Energy 8.4oz', sku: 'SKU-005', category: 'Beverages', price: 3.99, stock: 24, status: 'in-stock' },
  { id: 6, name: 'Tropical Fantasy Soda', sku: 'SKU-006', category: 'Beverages', price: 1.00, stock: 3, status: 'low-stock' },
  { id: 7, name: 'Chopped Cheese Sandwich', sku: 'SKU-007', category: 'Deli', price: 7.49, stock: 8, status: 'in-stock' },
  { id: 8, name: 'Hostess Honey Bun', sku: 'SKU-008', category: 'Snacks', price: 1.79, stock: 0, status: 'out-of-stock' },
  { id: 9, name: 'Café Bustelo Espresso Ground', sku: 'SKU-009', category: 'Beverages', price: 5.49, stock: 15, status: 'in-stock' },
  { id: 10, name: 'Goya Adobo Seasoning', sku: 'SKU-010', category: 'Canned Goods', price: 2.99, stock: 22, status: 'in-stock' },
  { id: 11, name: 'Dutch Farms Whole Milk 1gal', sku: 'SKU-011', category: 'Dairy', price: 4.99, stock: 5, status: 'low-stock' },
  { id: 12, name: 'Organic Bananas (bunch)', sku: 'SKU-012', category: 'Produce', price: 1.49, stock: 18, status: 'in-stock' },
  { id: 13, name: 'Limes (each)', sku: 'SKU-013', category: 'Produce', price: 0.50, stock: 2, status: 'low-stock' },
  { id: 14, name: 'Bounty Paper Towels 2pk', sku: 'SKU-014', category: 'Household', price: 6.99, stock: 14, status: 'in-stock' },
  { id: 15, name: 'Hot Pockets Pepperoni Pizza', sku: 'SKU-015', category: 'Frozen', price: 3.29, stock: 0, status: 'out-of-stock' },
  { id: 16, name: 'Modelo Especial 6pk', sku: 'SKU-016', category: 'Beverages', price: 11.99, stock: 36, status: 'in-stock' },
  { id: 17, name: 'Lay\'s Classic Chips', sku: 'SKU-017', category: 'Snacks', price: 2.49, stock: 41, status: 'in-stock' },
  { id: 18, name: 'Philadelphia Cream Cheese', sku: 'SKU-018', category: 'Dairy', price: 3.99, stock: 1, status: 'low-stock' },
  { id: 19, name: 'Avocados (each)', sku: 'SKU-019', category: 'Produce', price: 1.99, stock: 10, status: 'in-stock' },
  { id: 20, name: 'Clorox Wipes 35ct', sku: 'SKU-020', category: 'Household', price: 4.49, stock: 9, status: 'in-stock' },
  { id: 21, name: 'El Monterey Burritos 8pk', sku: 'SKU-021', category: 'Frozen', price: 5.99, stock: 7, status: 'in-stock' },
  { id: 22, name: 'Bacon Egg & Cheese on Roll', sku: 'SKU-022', category: 'Deli', price: 5.49, stock: 20, status: 'in-stock' },
  { id: 23, name: 'Jarritos Mandarin Soda', sku: 'SKU-023', category: 'Beverages', price: 1.79, stock: 0, status: 'out-of-stock' },
  { id: 24, name: 'Doritos Nacho Cheese', sku: 'SKU-024', category: 'Snacks', price: 2.49, stock: 29, status: 'in-stock' },
  { id: 25, name: 'Goya Sofrito 12oz', sku: 'SKU-025', category: 'Canned Goods', price: 2.49, stock: 4, status: 'low-stock' },
  { id: 26, name: 'Yellow Onions 3lb bag', sku: 'SKU-026', category: 'Produce', price: 2.99, stock: 11, status: 'in-stock' },
  { id: 27, name: 'Nesquik Chocolate Milk', sku: 'SKU-027', category: 'Dairy', price: 2.99, stock: 16, status: 'in-stock' },
  { id: 28, name: 'Tide Pods 16ct', sku: 'SKU-028', category: 'Household', price: 9.99, stock: 6, status: 'in-stock' },
  { id: 29, name: 'Eggo Waffles 10ct', sku: 'SKU-029', category: 'Frozen', price: 4.49, stock: 3, status: 'low-stock' },
  { id: 30, name: 'Turkey & Swiss on Hero', sku: 'SKU-030', category: 'Deli', price: 8.49, stock: 6, status: 'in-stock' },
]

const categories = ['All', 'Beverages', 'Snacks', 'Dairy', 'Produce', 'Canned Goods', 'Household', 'Frozen', 'Deli']

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  'in-stock': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'In Stock' },
  'low-stock': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Low Stock' },
  'out-of-stock': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Out of Stock' },
}

function getStatus(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) return 'out-of-stock'
  if (stock <= 5) return 'low-stock'
  return 'in-stock'
}

export default function DemoInventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Beverages', price: '', stock: '', sku: '' })

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(newProduct.price)
    const stock = parseInt(newProduct.stock)
    if (!newProduct.name || isNaN(price) || isNaN(stock) || !newProduct.sku) return

    const product: Product = {
      id: Date.now(),
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      price,
      stock,
      status: getStatus(stock),
    }
    setProducts((prev) => [product, ...prev])
    setNewProduct({ name: '', category: 'Beverages', price: '', stock: '', sku: '' })
    setShowAddModal(false)
  }

  function handleDelete(id: number) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inventory</h1>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: activeCategory === cat ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
              color: activeCategory === cat ? '#22c55e' : 'var(--text-secondary)',
              border: activeCategory === cat ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3" style={{ color: 'var(--text-muted)' }}>Product</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>SKU</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Category</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Price</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Stock</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const st = statusConfig[product.status]
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:brightness-110 transition">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: st.text }}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="px-2.5 py-1 rounded text-xs font-medium transition hover:opacity-80"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-2.5 py-1 rounded text-xs font-medium transition hover:opacity-80"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No products found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Add Product</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="e.g., Arizona Iced Tea"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>SKU</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="e.g., SKU-031"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
