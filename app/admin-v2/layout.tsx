'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin-v2/Sidebar'
import AdminAuthGuard from '@/components/admin-v2/AdminAuthGuard'

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin-v2/login'

  // Login page doesn't need sidebar or auth guard
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-black">
        <AdminSidebar />
        <main className="flex-1 ml-[280px] p-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  )
}
