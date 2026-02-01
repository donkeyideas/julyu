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
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{location.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {location.address}
          </p>
          <p className="text-sm text-gray-600">
            {location.city}, {location.state} {location.zip}
          </p>
          {location.phone && (
            <p className="text-sm text-gray-600 mt-1">
              Phone: {location.phone}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {location.is_active ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              Inactive
            </span>
          )}
          {verified ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Verified
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                Unverified
              </span>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}
          {hasCoordinates ? (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Location Set
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              No Location
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
