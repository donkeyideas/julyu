'use client'

import DemoStorePortalHeader from '@/components/demo/DemoStorePortalHeader'

export default function DemoStorePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DemoStorePortalHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
