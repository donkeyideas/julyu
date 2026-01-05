'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function SupabaseCheck() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if Supabase is configured
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/health/supabase')
        const data = await response.json()
        
        if (!data.configured && pathname !== '/setup-required' && pathname !== '/') {
          router.push('/setup-required')
        }
      } catch (error) {
        // If health check fails, assume not configured
        if (pathname !== '/setup-required' && pathname !== '/') {
          router.push('/setup-required')
        }
      }
    }

    checkConfig()
  }, [pathname, router])

  return null
}


