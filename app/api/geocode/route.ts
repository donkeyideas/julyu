import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Geocode an address using US Census Bureau Geocoder (free, no API key required)
 */
async function geocodeWithCensus(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Parse address components if possible
    const zipMatch = address.match(/\b(\d{5})\b/)
    const zip = zipMatch ? zipMatch[1] : ''

    // Try with full address first
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`

    console.log('[geocode] Trying Census geocoder for:', address)

    const response = await fetch(censusUrl, {
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()

      if (data.result?.addressMatches?.length > 0) {
        const match = data.result.addressMatches[0]
        const coords = match.coordinates
        console.log('[geocode] Census geocoding successful:', coords)
        return {
          lat: coords.y,
          lng: coords.x
        }
      }
    }
  } catch (error) {
    console.error('[geocode] Census geocoding error:', error)
  }

  return null
}

/**
 * Fallback: OpenStreetMap Nominatim (free, no API key)
 */
async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    console.log('[geocode] Trying Nominatim geocoder for:', address)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us&limit=1`

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Julyu/1.0 (contact: info@donkeyideas.com)'
      }
    })

    if (response.ok) {
      const data = await response.json()

      if (data && data.length > 0) {
        console.log('[geocode] Nominatim geocoding successful')
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    }
  } catch (error) {
    console.error('[geocode] Nominatim geocoding error:', error)
  }

  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    )
  }

  // Try Census Bureau first, then Nominatim as fallback
  let coords = await geocodeWithCensus(address)

  if (!coords) {
    coords = await geocodeWithNominatim(address)
  }

  if (!coords) {
    return NextResponse.json({
      success: false,
      error: 'Unable to geocode address'
    })
  }

  return NextResponse.json({
    success: true,
    coordinates: {
      latitude: coords.lat,
      longitude: coords.lng
    }
  })
}
