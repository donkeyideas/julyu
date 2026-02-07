'use client'

import DemoBanner from '@/components/demo/DemoBanner'
import { DemoProvider } from '@/lib/demo/providers/DemoProvider'
import { getDemoSession } from '@/lib/demo/utils/demo-auth'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { DemoSession } from '@/lib/demo/utils/demo-auth'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't check session on the entry page
    if (pathname === '/demo/enter') {
      setLoading(false)
      return
    }

    const demoSession = getDemoSession()
    if (!demoSession) {
      router.push('/demo/enter')
      return
    }
    setSession(demoSession)
    setLoading(false)
  }, [pathname, router])

  // Entry page doesn't need the provider or banner
  if (pathname === '/demo/enter') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading demo...</p>
        </div>
      </div>
    )
  }

  return (
    <DemoProvider session={session}>
      <DemoBanner />
      {children}
    </DemoProvider>
  )
}
