'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin-v2/Sidebar'
import AdminAuthGuard from '@/components/admin-v2/AdminAuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-black">
        <AdminSidebar />
        <main className="flex-1 ml-[280px] p-8 text-white">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  )
}
