'use client'

interface BodegaResult {
  store: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    distance: number
    storeOwnerId: string
    storefrontImage?: string | null
  }
  product: {
    inventoryId: string
    productId?: string | null
    name: string
    brand?: string | null
    size?: string | null
    imageUrl?: string | null
    price: number
    stockQuantity: number
    sku?: string | null
  }
  matchCount: number
}

interface Props {
  bodega: BodegaResult
  productQuery: string
  onOrderClick: (bodega: BodegaResult) => void
  onDirectionsClick: (bodega: BodegaResult) => void
}

export default function BodegaCard({ bodega, productQuery, onOrderClick, onDirectionsClick }: Props) {
  const { store, product } = bodega

  return (
    <div
      className="rounded-xl p-6 hover:shadow-lg transition-all"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {store.name}
            </h3>
            <span
              className="px-2 py-0.5 text-xs font-semibold rounded-full"
              style={{
                backgroundColor: 'var(--accent-primary-10)',
                color: 'var(--accent-primary)',
              }}
            >
              Local Bodega
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {store.distance.toFixed(1)} mi
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {store.phone}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {store.address}, {store.city}, {store.state} {store.zip}
          </p>
        </div>
        {store.storefrontImage && (
          <img
            src={store.storefrontImage}
            alt={store.name}
            className="w-20 h-20 object-cover rounded-lg ml-4"
          />
        )}
      </div>

      {/* Product Info */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-start gap-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div
              className="w-16 h-16 rounded flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </h4>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {product.brand && <span>{product.brand}</span>}
              {product.size && <span>• {product.size}</span>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                ${product.price.toFixed(2)}
              </div>
              <span
                className="text-sm px-2 py-0.5 rounded"
                style={{
                  backgroundColor: product.stockQuantity > 5 ? 'var(--accent-success-10)' : 'var(--accent-warning-10)',
                  color: product.stockQuantity > 5 ? 'var(--accent-success)' : 'var(--accent-warning)',
                }}
              >
                {product.stockQuantity} in stock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onOrderClick(bodega)}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition text-sm"
        >
          Order from {store.name}
        </button>
        <button
          onClick={() => onDirectionsClick(bodega)}
          className="px-4 py-3 rounded-lg transition text-sm font-semibold"
          style={{
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </button>
      </div>

      {bodega.matchCount > 1 && (
        <div
          className="mt-3 text-xs text-center py-2 px-3 rounded"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
          }}
        >
          + {bodega.matchCount - 1} more matching {bodega.matchCount === 2 ? 'product' : 'products'} available
        </div>
      )}
    </div>
  )
}
