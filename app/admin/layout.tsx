'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/admin-auth'
import AdminSidebar from '@/components/admin-v2/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user has admin session
    const session = getAdminSession()
    if (!session) {
      // Redirect to admin login
      router.push('/admin-v2/login')
      return
    }
    setIsChecking(false)
  }, [router])

  // Show nothing while checking auth
  if (isChecking) {
    return null
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
