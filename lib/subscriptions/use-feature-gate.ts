'use client'

/**
 * Client-side React hook for feature gating.
 * Fetches the user's plan and features from the API.
 */

import { useState, useEffect, useCallback } from 'react'
import type { FeatureKey, SubscriptionPlan } from '@/shared/types/subscriptions'

interface FeatureGateState {
  features: string[]
  plan: SubscriptionPlan | null
  loading: boolean
  hasFeature: (key: FeatureKey) => boolean
}

export function useFeatureGate(): FeatureGateState {
  const [features, setFeatures] = useState<string[]>([])
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        // Build headers for Firebase users
        const headers: HeadersInit = {}
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('julyu_user')
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser)
              if (user.id) headers['x-user-id'] = user.id
            } catch {
              // ignore
            }
          }
        }

        const response = await fetch('/api/subscriptions/plans/me', { headers })
        if (response.ok) {
          const data = await response.json()
          setFeatures(data.features || [])
          setPlan(data.plan || null)
        }
      } catch (error) {
        console.error('Failed to load feature gate:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFeatures()
  }, [])

  const hasFeature = useCallback(
    (key: FeatureKey): boolean => features.includes(key),
    [features]
  )

  return { features, plan, loading, hasFeature }
}
