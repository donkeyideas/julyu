import { createServerClient } from '@/lib/supabase/server'
import { getStoreOwner, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InventoryTable from '@/components/store-portal/InventoryTable'

export const metadata = {
  title: 'Inventory - Store Portal - Julyu',
  description: 'Manage your store inventory',
}

export default async function InventoryPage() {
  const { storeOwner, error } = await getStoreOwner()

  if (error) {
    redirect('/store-portal/apply')
  }

  if (!storeOwner) {
    redirect('/login')
  }

  const supabase = await createServerClient()

  // Get store owner's stores
  const { stores } = await getStoreOwnerStores(storeOwner.id)
  const primaryStore = stores[0]

  // Get inventory with product details
  const { data: inventory, error: inventoryError } = await supabase
    .from('bodega_inventory')
    .select(`
      *,
      product:products(*)
    `)
    .eq('bodega_store_id', primaryStore?.id || '')
    .order('updated_at', { ascending: false })

  const inventoryItems = inventory || []

  // Calculate stats
  const totalProducts = inventoryItems.length
  const inStockCount = inventoryItems.filter((item: any) => item.in_stock && item.stock_quantity > 0).length
  const lowStockCount = inventoryItems.filter((item: any) => item.stock_quantity > 0 && item.stock_quantity <= 5).length
  const outOfStockCount = inventoryItems.filter((item: any) => !item.in_stock || item.stock_quantity === 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">
            Manage your store&apos;s products and stock levels
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/store-portal/inventory/import"
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
          >
            Import Receipt
          </Link>
          <Link
            href="/store-portal/inventory/add"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Add Products
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Total Products</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">In Stock</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{inStockCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-500">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</div>
        </div>
      </div>

      {/* POS Sync Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Connect your POS system</h3>
            <p className="text-sm text-blue-800 mt-1">
              Automatically sync inventory from Square or Clover POS systems.
            </p>
            <Link
              href="/store-portal/inventory/pos-sync"
              className="text-sm text-blue-700 underline hover:text-blue-600 mt-2 inline-block"
            >
              Set up POS integration →
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {inventoryItems.length > 0 ? (
          <InventoryTable items={inventoryItems} storeId={primaryStore?.id || ''} />
        ) : (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding products manually or importing from a receipt
            </p>
            <div className="flex justify-center space-x-3">
              <Link
                href="/store-portal/inventory/add"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Add Products
              </Link>
              <Link
                href="/store-portal/inventory/import"
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
              >
                Import Receipt
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
