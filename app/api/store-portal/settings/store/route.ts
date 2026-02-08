import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getStoreOwnerAnyStatus, getStoreOwnerStores } from '@/lib/auth/store-portal-auth'

export const dynamic = 'force-dynamic'

/**
 * Geocode an address using multiple services with fallbacks
 * 1. US Census Bureau Geocoder (free, no API key, reliable for US addresses)
 * 2. Google Maps API (if API key configured)
 * 3. OpenStreetMap Nominatim (free fallback)
 */
async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null> {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`
  console.log('[settings/store] Geocoding address:', fullAddress)

  // Try US Census Bureau Geocoder first (free, reliable, no API key needed)
  // This is the most reliable option for US addresses
  try {
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/address?street=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&zip=${encodeURIComponent(zip)}&benchmark=Public_AR_Current&format=json`
    console.log('[settings/store] Trying US Census geocoder...')

    const response = await fetch(censusUrl, {
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log('[settings/store] Census response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('[settings/store] Census response:', JSON.stringify(data).substring(0, 500))

      if (data.result?.addressMatches?.length > 0) {
        const match = data.result.addressMatches[0]
        const coords = match.coordinates
        console.log('[settings/store] Census geocoding successful:', coords)
        return {
          lat: coords.y,
          lng: coords.x
        }
      }
      console.log('[settings/store] Census geocoding: no address matches found')
    } else {
      console.log('[settings/store] Census geocoding failed with status:', response.status)
    }
  } catch (error) {
    console.error('[settings/store] Census geocoding error:', error)
  }

  // Try Google Maps API (if configured)
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleApiKey) {
    try {
      console.log('[settings/store] Trying Google geocoder...')
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
      console.log('[settings/store] Google geocoding failed:', data.status, data.error_message || '')
    } catch (error) {
      console.error('[settings/store] Google geocoding error:', error)
    }
  }

  // Fallback: OpenStreetMap Nominatim (free, no API key)
  try {
    console.log('[settings/store] Trying Nominatim geocoder...')
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=us&limit=1`

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Julyu/1.0 (contact: info@donkeyideas.com)'
      }
    })

    console.log('[settings/store] Nominatim response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('[settings/store] Nominatim response:', JSON.stringify(data).substring(0, 300))

      if (data && data.length > 0) {
        console.log('[settings/store] Nominatim geocoding successful')
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
      console.log('[settings/store] Nominatim geocoding: no results')
    } else {
      const errorText = await response.text()
      console.log('[settings/store] Nominatim failed:', response.status, errorText.substring(0, 200))
    }
  } catch (error) {
    console.error('[settings/store] Nominatim geocoding error:', error)
  }

  console.log('[settings/store] All geocoding attempts failed for:', fullAddress)
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
