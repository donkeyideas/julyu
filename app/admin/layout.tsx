'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminSidebar from '@/components/admin/Sidebar'

export default function AdminLayout({
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
          // Check if user is admin
          // For test auth, check localStorage or user object
          let isAdmin = false
          
          if (typeof window !== 'undefined') {
            const testUser = localStorage.getItem('test_user')
            if (testUser) {
              try {
                const userData = JSON.parse(testUser)
                isAdmin = userData.subscription_tier === 'enterprise'
              } catch {
                // Invalid JSON
              }
            }
          }
          
          // Also check user object if it has subscription_tier
          if ((user as any).subscription_tier === 'enterprise') {
            isAdmin = true
          }
          
          // Allow access if admin, or if no Supabase configured (testing mode)
          if (isAdmin || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setAuthenticated(true)
          } else {
            router.push('/dashboard')
          }
        } else {
          // Check localStorage for test auth
          if (typeof window !== 'undefined') {
            const testUser = localStorage.getItem('test_user')
            if (testUser) {
              try {
                const userData = JSON.parse(testUser)
                if (userData.subscription_tier === 'enterprise' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                  setAuthenticated(true)
                } else {
                  router.push('/dashboard')
                }
              } catch {
                router.push('/auth/login')
              }
            } else {
              router.push('/auth/login')
            }
          } else {
            router.push('/auth/login')
          }
        }
      } catch (error) {
        // Check localStorage for test auth
        if (typeof window !== 'undefined') {
          const testUser = localStorage.getItem('test_user')
          if (testUser) {
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AdminSidebar />
      <main className="flex-1 ml-[280px] p-8">
        {children}
      </main>
    </div>
  )
}

