'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setAuthenticated(true)
          setLoading(false)
          return
        }

        // Check localStorage for test auth or Firebase auth
        if (typeof window !== 'undefined') {
          const testUser = localStorage.getItem('test_user')
          const firebaseUser = localStorage.getItem('julyu_user')
          if (testUser || firebaseUser) {
            setAuthenticated(true)
            setLoading(false)
            return
          }
        }

        // No auth found, redirect to login
        router.push('/auth/login')
      } catch (error) {
        // Check localStorage for test auth or Firebase auth
        if (typeof window !== 'undefined') {
          const testUser = localStorage.getItem('test_user')
          const firebaseUser = localStorage.getItem('julyu_user')
          if (testUser || firebaseUser) {
            setAuthenticated(true)
          } else {
            router.push('/auth/login')
          }
        } else {
          router.push('/auth/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-green-500 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main className="flex-1 ml-[280px] p-8">
        {children}
      </main>
    </div>
  )
}

