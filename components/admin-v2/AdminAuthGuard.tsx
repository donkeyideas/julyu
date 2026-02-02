'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAdminSessionToken, clearAdminSessionToken } from '@/lib/auth/admin-session-client'
import { AdminPermissions, canAccessRoute } from '@/lib/auth/permissions'

interface AdminEmployee {
  id: string
  email: string
  name: string
  permissions: AdminPermissions
}

interface AuthContextType {
  employee: AdminEmployee | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  employee: null,
  logout: async () => {},
})

export function useAdminAuth() {
  return useContext(AuthContext)
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [employee, setEmployee] = useState<AdminEmployee | null>(null)

  const logout = async () => {
    try {
      const token = getAdminSessionToken()
      if (token) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAdminSessionToken()
      router.push('/admin-v2/login')
    }
  }

  useEffect(() => {
    const validateSession = async () => {
      // Skip auth check for login page only
      if (pathname === '/admin-v2/login') {
        setIsAuthenticated(true)
        return
      }

      const token = getAdminSessionToken()

      if (!token) {
        router.push('/admin-v2/login')
        return
      }

      try {
        const response = await fetch('/api/admin/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await response.json()

        if (!data.valid) {
          clearAdminSessionToken()
          router.push('/admin-v2/login')
          return
        }

        // If 2FA is required, redirect to login with 2FA step
        if (data.requires2FA) {
          router.push('/admin-v2/login?step=verify-2fa')
          return
        }

        // If password change is required, redirect to change password page
        if (data.requiresPasswordChange) {
          // For now, redirect to login - could create a dedicated password change page
          router.push('/admin-v2/login')
          return
        }

        // Check page permissions
        if (data.employee?.permissions && !canAccessRoute(data.employee.permissions, pathname)) {
          // Redirect to dashboard if no permission for this page
          router.push('/admin-v2')
          return
        }

        setEmployee(data.employee)
        setIsAuthenticated(true)
      } catch (err) {
        console.error('Session validation error:', err)
        clearAdminSessionToken()
        router.push('/admin-v2/login')
      }
    }

    validateSession()
  }, [pathname, router])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-green-500">
          <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ employee, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
