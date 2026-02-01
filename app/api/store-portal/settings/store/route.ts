import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

/**
 * Geocode an address using multiple services with fallbacks
 * 1. Google Maps API (if API key configured)
 * 2. OpenStreetMap Nominatim (free, no API key needed)
 */
async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`
  console.log('[settings/store] Geocoding address:', fullAddress)

  // Try Google Maps API first (if configured)
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleApiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results[0]) {
        console.log('[settings/store] Google geocoding successful')
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng
        }
      }
      console.log('[settings/store] Google geocoding failed:', data.status)
    } catch (error) {
      console.error('[settings/store] Google geocoding error:', error)
    }
  } else {
    console.log('[settings/store] No Google Maps API key, trying Nominatim...')
  }

  // Fallback: OpenStreetMap Nominatim (free, no API key)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=us&limit=1`,
      {
        headers: {
          'User-Agent': 'Julyu/1.0 (https://julyu.com)'  // Required by Nominatim
        }
      }
    )
    const data = await response.json()

    if (data && data.length > 0) {
      console.log('[settings/store] Nominatim geocoding successful')
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    console.log('[settings/store] Nominatim geocoding failed: no results')
  } catch (error) {
    console.error('[settings/store] Nominatim geocoding error:', error)
  }

  // Final fallback: Try Positionstack if API key exists
  if (process.env.POSITIONSTACK_API_KEY) {
    try {
      const response = await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${process.env.POSITIONSTACK_API_KEY}&query=${encodeURIComponent(fullAddress)}`
      )
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        console.log('[settings/store] Positionstack geocoding successful')
        return {
          lat: data.data[0].latitude,
          lng: data.data[0].longitude
        }
      }
    } catch (error) {
      console.error('[settings/store] Positionstack geocoding error:', error)
    }
  }

  console.log('[settings/store] All geocoding attempts failed')
  return null
}

export async function PUT(request: NextRequest) {
  try {
    const { storeOwner, error, status } = await getStoreOwnerAnyStatus()

    if (error || !storeOwner) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    const body = await request.json()
    const { name, address, city, state, zip, phone } = body

    // Validate required fields
    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Name, address, city, state, and ZIP are required' },
        { status: 400 }
      )
    }

    // Get store owner's stores
    const { stores } = await getStoreOwnerStores(storeOwner.id)
    const primaryStore = stores[0]

    if (!primaryStore) {
      return NextResponse.json(
        { error: 'No store found for this account' },
        { status: 404 }
      )
    }

    // Use service role client to update verified status (bypasses RLS)
    const supabase = createServiceRoleClient() as any

    // Check if address changed - if so, re-geocode
    const addressChanged =
      primaryStore.address !== address ||
      primaryStore.city !== city ||
      primaryStore.state !== state ||
      primaryStore.zip !== zip

    let latitude = primaryStore.latitude
    let longitude = primaryStore.longitude

    if (addressChanged || !latitude || !longitude) {
      console.log('[settings/store] Geocoding address...')
      const coords = await geocodeAddress(address, city, state, zip)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
        console.log('[settings/store] Geocoded:', { latitude, longitude })
      }
    }

    // Auto-verify if store owner is approved
    // This ensures stores appear in consumer search results
    const isApproved = storeOwner.application_status === 'approved'

    // Update store with all fields including verification and coordinates
    const updateData: Record<string, any> = {
      name,
      address,
      city,
      state,
      zip,
      phone: phone || null,
      updated_at: new Date().toISOString()
    }

    // Add coordinates if we have them
    if (latitude && longitude) {
      updateData.latitude = latitude
      updateData.longitude = longitude
    }

    // Auto-verify approved store owners
    if (isApproved) {
      updateData.verified = true
      updateData.is_active = true
      console.log('[settings/store] Auto-verifying store for approved owner')
    }

    const { error: updateError } = await supabase
      .from('bodega_stores')
      .update(updateData)
      .eq('id', primaryStore.id)
      .eq('store_owner_id', storeOwner.id)

    if (updateError) {
      console.error('[settings/store] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update store information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      verified: isApproved,
      hasCoordinates: !!(latitude && longitude)
    })
  } catch (error) {
    console.error('[settings/store] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}
