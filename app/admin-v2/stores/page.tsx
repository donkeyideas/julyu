'use client'

export default function AllStoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          All Stores
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          View and manage all registered stores
        </p>
      </div>

      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          This page is being migrated to the new admin system.
        </p>
        <a
          href="/admin/stores"
          className="inline-block mt-4 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Go to Legacy Page
        </a>
      </div>
    </div>
  )
}
