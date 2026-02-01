'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import InventoryTable from '@/components/store-portal/InventoryTable'
import { InventorySkeleton } from '@/components/store-portal/Skeleton'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface Stats {
  total: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [storeId, setStoreId] = useState<string>('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasMore: false
  })
  const [stats, setStats] = useState<Stats>({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  })
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchInventory = useCallback(async (page: number, searchTerm: string, filter: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(searchTerm && { search: searchTerm }),
        ...(filter && { stock: filter })
      })

      const response = await fetch(`/api/store-portal/inventory?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load inventory')
        return
      }

      setInventoryItems(data.data || [])
      setPagination(data.pagination)
      setStats(data.stats)
      setStoreId(data.storeId || '')
    } catch (err) {
      setError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory(1, '', '')
  }, [fetchInventory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    fetchInventory(1, searchInput, stockFilter)
  }

  const handleFilterChange = (filter: string) => {
    setStockFilter(filter)
    fetchInventory(1, search, filter)
  }

  const handlePageChange = (newPage: number) => {
    fetchInventory(newPage, search, stockFilter)
  }

  const handleRefresh = () => {
    fetchInventory(pagination.page, search, stockFilter)
  }

  if (loading && inventoryItems.length === 0) {
    return <InventorySkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inventory</h1>
          </div>
        </div>
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inventory</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your store&apos;s products and stock levels
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/store-portal/inventory/bulk-import"
            className="px-4 py-2 font-medium rounded-md transition"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Bulk Import
          </Link>
          <Link
            href="/store-portal/inventory/import"
            className="px-4 py-2 font-medium rounded-md transition"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Import Receipt
          </Link>
          <Link
            href="/store-portal/inventory/add"
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats - Clickable filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleFilterChange('')}
          className={`rounded-lg p-4 text-left transition ${stockFilter === '' ? 'ring-2 ring-green-500' : ''}`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Products</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
        </button>
        <button
          onClick={() => handleFilterChange('in_stock')}
          className={`rounded-lg p-4 text-left transition ${stockFilter === 'in_stock' ? 'ring-2 ring-green-500' : ''}`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>In Stock</div>
          <div className="text-2xl font-bold text-green-500 mt-1">{stats.inStock}</div>
        </button>
        <button
          onClick={() => handleFilterChange('low_stock')}
          className={`rounded-lg p-4 text-left transition ${stockFilter === 'low_stock' ? 'ring-2 ring-yellow-500' : ''}`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Low Stock</div>
          <div className="text-2xl font-bold text-yellow-500 mt-1">{stats.lowStock}</div>
        </button>
        <button
          onClick={() => handleFilterChange('out_of_stock')}
          className={`rounded-lg p-4 text-left transition ${stockFilter === 'out_of_stock' ? 'ring-2 ring-red-500' : ''}`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Out of Stock</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{stats.outOfStock}</div>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search products by name, brand, or SKU..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400 transition"
        >
          Search
        </button>
        {(search || stockFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              setSearch('')
              setStockFilter('')
              fetchInventory(1, '', '')
            }}
            className="px-4 py-2 font-medium rounded-md transition"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Clear
          </button>
        )}
      </form>

      {/* POS Sync Notice */}
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Connect your POS system</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Automatically sync inventory from Square or Clover POS systems.
            </p>
            <Link
              href="/store-portal/inventory/pos-sync"
              className="text-sm text-green-500 hover:text-green-400 mt-2 inline-block"
            >
              Set up POS integration →
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        ) : inventoryItems.length > 0 ? (
          <>
            <InventoryTable items={inventoryItems} storeId={storeId} onRefresh={handleRefresh} />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                            pagination.page === pageNum ? 'bg-green-500 text-black' : ''
                          }`}
                          style={pagination.page !== pageNum ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' } : {}}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {search || stockFilter ? (
              <>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No products found</h3>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                    setStockFilter('')
                    fetchInventory(1, '', '')
                  }}
                  className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No products yet</h3>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Start by adding products manually, importing from Excel/CSV, or scanning a receipt
                </p>
                <div className="flex justify-center flex-wrap gap-3">
                  <Link
                    href="/store-portal/inventory/add"
                    className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
                  >
                    Add Product
                  </Link>
                  <Link
                    href="/store-portal/inventory/bulk-import"
                    className="px-4 py-2 font-medium rounded-md"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    Bulk Import (CSV/Excel)
                  </Link>
                  <Link
                    href="/store-portal/inventory/import"
                    className="px-4 py-2 font-medium rounded-md"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    Import Receipt
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
