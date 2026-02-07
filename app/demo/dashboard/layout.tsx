'use client'

import DemoSidebar from '@/components/demo/DemoSidebar'

export default function DemoDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DemoSidebar />
      <main className="flex-1 ml-[280px] p-8">
        {children}
      </main>
    </div>
  )
}
