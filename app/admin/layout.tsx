'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/admin-auth'
import AdminSidebar from '@/components/admin-v2/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    console.log('[Admin Layout] Checking auth for path:', pathname)

    const session = getAdminSession()
    console.log('[Admin Layout] Session found:', session ? 'YES' : 'NO')

    if (!session) {
      console.log('[Admin Layout] No session, redirecting to login')
      router.push('/admin-v2/login')
      return
    }

    console.log('[Admin Layout] Session valid, rendering page')
    setIsAuthenticated(true)
  }, [pathname, router])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Verifying admin access...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 ml-[280px] p-8 text-white">
        {children}
      </main>
    </div>
  )
}
