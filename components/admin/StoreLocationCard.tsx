'use client'

import { useState } from 'react'

interface StoreLocation {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  is_active: boolean
  verified: boolean
  latitude?: number
  longitude?: number
}

interface Props {
  location: StoreLocation
}

export default function StoreLocationCard({ location }: Props) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verified, setVerified] = useState(location.verified)
  const [hasCoordinates, setHasCoordinates] = useState(!!(location.latitude && location.longitude))
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/stores/${location.id}/verify`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify store')
      }

      setVerified(true)
      setHasCoordinates(data.store?.hasCoordinates || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify store')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{location.name}</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {location.address}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {location.city}, {location.state} {location.zip}
          </p>
          {location.phone && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Phone: {location.phone}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {location.is_active ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-green-500/15 text-green-500">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-gray-500/15 text-gray-500">
              Inactive
            </span>
          )}
          {verified ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-500/15 text-blue-500">
              Verified
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-yellow-500/15 text-yellow-500">
                Unverified
              </span>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-2 py-1 text-xs font-semibold rounded-lg bg-green-500 text-black hover:bg-green-600 disabled:opacity-50 transition"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}
          {hasCoordinates ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-green-500/15 text-green-500">
              Location Set
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-gray-500/15" style={{ color: 'var(--text-muted)' }}>
              No Location
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
