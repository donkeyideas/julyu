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

  // Last resort fallback: Use zip code center for known NYC zip codes
  // This ensures stores can be found even when all geocoding services fail
  if (zip) {
    const nycZipCoords: Record<string, { lat: number; lng: number }> = {
      // Brooklyn
      '11229': { lat: 40.6008, lng: -73.9447 },
      '11201': { lat: 40.6944, lng: -73.9905 },
      '11211': { lat: 40.7128, lng: -73.9538 },
      '11215': { lat: 40.6629, lng: -73.9864 },
      '11217': { lat: 40.6824, lng: -73.9772 },
      '11218': { lat: 40.6432, lng: -73.9772 },
      '11219': { lat: 40.6328, lng: -73.9967 },
      '11220': { lat: 40.6414, lng: -74.0170 },
      '11221': { lat: 40.6917, lng: -73.9274 },
      '11222': { lat: 40.7272, lng: -73.9487 },
      '11223': { lat: 40.5973, lng: -73.9732 },
      '11224': { lat: 40.5767, lng: -73.9886 },
      '11225': { lat: 40.6632, lng: -73.9545 },
      '11226': { lat: 40.6468, lng: -73.9567 },
      '11228': { lat: 40.6175, lng: -74.0131 },
      '11230': { lat: 40.6220, lng: -73.9657 },
      '11231': { lat: 40.6781, lng: -74.0028 },
      '11232': { lat: 40.6590, lng: -74.0028 },
      '11233': { lat: 40.6781, lng: -73.9194 },
      '11234': { lat: 40.6228, lng: -73.9239 },
      '11235': { lat: 40.5847, lng: -73.9499 },
      '11236': { lat: 40.6397, lng: -73.9011 },
      '11237': { lat: 40.7044, lng: -73.9211 },
      '11238': { lat: 40.6791, lng: -73.9639 },
      '11239': { lat: 40.6475, lng: -73.8792 },
      // Manhattan
      '10001': { lat: 40.7506, lng: -73.9971 },
      '10002': { lat: 40.7157, lng: -73.9863 },
      '10003': { lat: 40.7317, lng: -73.9892 },
      '10004': { lat: 40.6989, lng: -74.0385 },
      '10005': { lat: 40.7069, lng: -74.0089 },
      '10006': { lat: 40.7094, lng: -74.0131 },
      '10007': { lat: 40.7135, lng: -74.0078 },
      '10009': { lat: 40.7265, lng: -73.9797 },
      '10010': { lat: 40.7390, lng: -73.9826 },
      '10011': { lat: 40.7418, lng: -74.0002 },
      '10012': { lat: 40.7258, lng: -73.9981 },
      '10013': { lat: 40.7197, lng: -74.0046 },
      '10014': { lat: 40.7340, lng: -74.0054 },
      '10016': { lat: 40.7459, lng: -73.9783 },
      '10017': { lat: 40.7522, lng: -73.9726 },
      '10018': { lat: 40.7551, lng: -73.9919 },
      '10019': { lat: 40.7654, lng: -73.9854 },
      '10020': { lat: 40.7587, lng: -73.9787 },
      '10021': { lat: 40.7693, lng: -73.9588 },
      '10022': { lat: 40.7587, lng: -73.9672 },
      '10023': { lat: 40.7764, lng: -73.9823 },
      '10024': { lat: 40.7870, lng: -73.9754 },
      '10025': { lat: 40.7992, lng: -73.9680 },
      '10026': { lat: 40.8027, lng: -73.9534 },
      '10027': { lat: 40.8117, lng: -73.9534 },
      '10028': { lat: 40.7764, lng: -73.9534 },
      '10029': { lat: 40.7917, lng: -73.9438 },
      '10030': { lat: 40.8185, lng: -73.9438 },
      '10031': { lat: 40.8256, lng: -73.9491 },
      '10032': { lat: 40.8389, lng: -73.9426 },
      '10033': { lat: 40.8506, lng: -73.9342 },
      '10034': { lat: 40.8676, lng: -73.9257 },
      '10035': { lat: 40.8002, lng: -73.9310 },
      '10036': { lat: 40.7593, lng: -73.9903 },
      '10037': { lat: 40.8131, lng: -73.9374 },
      '10038': { lat: 40.7090, lng: -74.0025 },
      '10039': { lat: 40.8263, lng: -73.9374 },
      '10040': { lat: 40.8588, lng: -73.9310 },
      // Queens
      '11101': { lat: 40.7472, lng: -73.9403 },
      '11102': { lat: 40.7722, lng: -73.9247 },
      '11103': { lat: 40.7622, lng: -73.9138 },
      '11104': { lat: 40.7447, lng: -73.9203 },
      '11105': { lat: 40.7786, lng: -73.9065 },
      '11106': { lat: 40.7619, lng: -73.9312 },
      // Bronx
      '10451': { lat: 40.8200, lng: -73.9245 },
      '10452': { lat: 40.8377, lng: -73.9236 },
      '10453': { lat: 40.8529, lng: -73.9125 },
      '10454': { lat: 40.8065, lng: -73.9187 },
      '10455': { lat: 40.8148, lng: -73.9085 },
      '10456': { lat: 40.8307, lng: -73.9085 },
      '10457': { lat: 40.8479, lng: -73.8984 },
      '10458': { lat: 40.8632, lng: -73.8883 },
      '10459': { lat: 40.8268, lng: -73.8934 },
      '10460': { lat: 40.8420, lng: -73.8782 },
    }

    if (nycZipCoords[zip]) {
      console.log('[settings/store] Using NYC zip code fallback for:', zip)
      return nycZipCoords[zip]
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
