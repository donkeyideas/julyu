import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Verify a bodega store and geocode its address
 * This sets verified=true and adds lat/long coordinates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[VerifyStore] ====== VERIFICATION STARTED ======')

  try {
    const { id } = await params
    console.log('[VerifyStore] Store ID:', id)

    if (!id) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient() as any

    // Get store details
    const { data: store, error: fetchError } = await supabase
      .from('bodega_stores')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !store) {
      console.error('[VerifyStore] Store not found:', fetchError)
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    console.log('[VerifyStore] Found store:', store.name, 'at', store.address)

    // Geocode the address if we don't have coordinates
    let latitude = store.latitude
    let longitude = store.longitude

    if (!latitude || !longitude) {
      const fullAddress = `${store.address || ''}, ${store.city || ''}, ${store.state || ''} ${store.zip || ''}`
      console.log('[VerifyStore] Geocoding address:', fullAddress)

      try {
        // Try Google Geocoding API first
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        if (googleApiKey) {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
          )
          const geocodeData = await geocodeResponse.json()

          if (geocodeData.status === 'OK' && geocodeData.results[0]) {
            latitude = geocodeData.results[0].geometry.location.lat
            longitude = geocodeData.results[0].geometry.location.lng
            console.log('[VerifyStore] Geocoded successfully:', { latitude, longitude })
          } else {
            console.log('[VerifyStore] Google geocoding failed:', geocodeData.status)
          }
        }

        // Fallback: Try Positionstack if Google fails
        if ((!latitude || !longitude) && process.env.POSITIONSTACK_API_KEY) {
          const positionstackResponse = await fetch(
            `http://api.positionstack.com/v1/forward?access_key=${process.env.POSITIONSTACK_API_KEY}&query=${encodeURIComponent(fullAddress)}`
          )
          const positionstackData = await positionstackResponse.json()

          if (positionstackData.data && positionstackData.data.length > 0) {
            latitude = positionstackData.data[0].latitude
            longitude = positionstackData.data[0].longitude
            console.log('[VerifyStore] Positionstack geocoded:', { latitude, longitude })
          }
        }

        // Final fallback: Use zip code center (approximate)
        if ((!latitude || !longitude) && store.zip) {
          console.log('[VerifyStore] Using zip code fallback for:', store.zip)
          // Common NYC zip codes - add more as needed
          const zipCoords: Record<string, { lat: number; lng: number }> = {
            '11229': { lat: 40.6008, lng: -73.9447 }, // Brooklyn
            '10001': { lat: 40.7506, lng: -73.9971 }, // Manhattan
            '10002': { lat: 40.7157, lng: -73.9863 },
            '11201': { lat: 40.6944, lng: -73.9905 }, // Brooklyn Heights
            '11211': { lat: 40.7128, lng: -73.9538 }, // Williamsburg
          }

          if (zipCoords[store.zip]) {
            latitude = zipCoords[store.zip].lat
            longitude = zipCoords[store.zip].lng
            console.log('[VerifyStore] Used zip fallback:', { latitude, longitude })
          }
        }
      } catch (geocodeError) {
        console.error('[VerifyStore] Geocoding error:', geocodeError)
      }
    }

    // Update store with verification and coordinates
    const updateData: Record<string, any> = {
      verified: true,
      is_active: true,
    }

    if (latitude && longitude) {
      updateData.latitude = latitude
      updateData.longitude = longitude
    }

    console.log('[VerifyStore] Updating store with:', updateData)

    const { data: updatedStore, error: updateError } = await supabase
      .from('bodega_stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[VerifyStore] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify store', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[VerifyStore] ====== VERIFICATION SUCCESSFUL ======')

    return NextResponse.json({
      success: true,
      message: 'Store verified successfully',
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        verified: updatedStore.verified,
        is_active: updatedStore.is_active,
        latitude: updatedStore.latitude,
        longitude: updatedStore.longitude,
        hasCoordinates: !!(updatedStore.latitude && updatedStore.longitude),
      }
    })

  } catch (error) {
    console.error('[VerifyStore] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
