/**
 * Geocoding Service
 * Converts addresses and zip codes to geographic coordinates using Positionstack API
 * Implements aggressive caching to minimize API calls and stay within free tier limits
 */

import { createServerClient } from '@/lib/supabase/server'
import { getApiKey } from '@/lib/api/config'

export interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
  confidence: number // 0-1 score
  source: 'positionstack' | 'cache' | 'zip_fallback'
}

interface PositionstackResponse {
  data: Array<{
    latitude: number
    longitude: number
    label: string
    confidence: number
    type: string
    name: string
    number: string | null
    postal_code: string
    street: string
    locality: string
    region: string
    region_code: string
    country: string
    country_code: string
  }>
}

/**
 * Normalize a lookup key for consistent caching
 */
function normalizeLookupKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Check cache for existing geocode result
 */
async function checkCache(lookupKey: string): Promise<GeocodeResult | null> {
  try {
    const supabase = createServerClient()
    const normalizedKey = normalizeLookupKey(lookupKey)

    const { data, error } = await supabase
      .from('geocode_cache')
      .select('*')
      .eq('lookup_key', normalizedKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return null
    }

    console.log('[Geocoding] Cache hit for:', lookupKey)

    return {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      formattedAddress: data.formatted_address,
      confidence: data.confidence ? parseFloat(data.confidence) : 1.0,
      source: 'cache'
    }
  } catch (error) {
    console.error('[Geocoding] Cache check error:', error)
    return null
  }
}

/**
 * Save geocode result to cache
 */
async function saveToCache(
  lookupKey: string,
  result: GeocodeResult
): Promise<void> {
  try {
    const supabase = createServerClient()
    const normalizedKey = normalizeLookupKey(lookupKey)

    const { error } = await supabase
      .from('geocode_cache')
      .upsert({
        lookup_key: normalizedKey,
        latitude: result.latitude,
        longitude: result.longitude,
        formatted_address: result.formattedAddress,
        confidence: result.confidence,
        source: result.source,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }, {
        onConflict: 'lookup_key'
      })

    if (error) {
      console.error('[Geocoding] Cache save error:', error)
    } else {
      console.log('[Geocoding] Saved to cache:', lookupKey)
    }
  } catch (error) {
    console.error('[Geocoding] Cache save exception:', error)
  }
}

/**
 * Call Positionstack API to geocode an address or zip code
 */
async function callPositionstack(query: string): Promise<GeocodeResult | null> {
  try {
    const apiKey = await getApiKey('positionstack')

    if (!apiKey || apiKey.trim() === '') {
      console.error('[Geocoding] Positionstack API key not configured')
      return null
    }

    const url = new URL('http://api.positionstack.com/v1/forward')
    url.searchParams.append('access_key', apiKey)
    url.searchParams.append('query', query)
    url.searchParams.append('limit', '1')

    console.log('[Geocoding] Calling Positionstack API for:', query)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('[Geocoding] Positionstack API error:', response.status, response.statusText)

      if (response.status === 429) {
        console.error('[Geocoding] Rate limit exceeded - using cache only')
      }

      return null
    }

    const data: PositionstackResponse = await response.json()

    if (!data.data || data.data.length === 0) {
      console.log('[Geocoding] No results from Positionstack for:', query)
      return null
    }

    const result = data.data[0]

    console.log('[Geocoding] Positionstack result:', {
      lat: result.latitude,
      lng: result.longitude,
      label: result.label,
      confidence: result.confidence
    })

    return {
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.label,
      confidence: result.confidence || 0.8,
      source: 'positionstack'
    }
  } catch (error: any) {
    console.error('[Geocoding] Positionstack API exception:', error.message)
    return null
  }
}

/**
 * Geocode a full address
 * Checks cache first, then calls Positionstack API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim() === '') {
    return null
  }

  console.log('[Geocoding] Geocoding address:', address)

  // Check cache first
  const cached = await checkCache(address)
  if (cached) {
    return cached
  }

  // Call Positionstack API
  const result = await callPositionstack(address)

  // Save to cache if successful
  if (result) {
    await saveToCache(address, result)
  }

  return result
}

/**
 * Geocode a zip code
 * Checks cache first, then calls Positionstack API
 */
export async function geocodeZipCode(zipCode: string): Promise<GeocodeResult | null> {
  if (!zipCode || zipCode.trim() === '') {
    return null
  }

  console.log('[Geocoding] Geocoding zip code:', zipCode)

  // Check cache first
  const cached = await checkCache(zipCode)
  if (cached) {
    return cached
  }

  // Call Positionstack API with zip code + country code for better results
  const query = `${zipCode}, USA`
  const result = await callPositionstack(query)

  // Save to cache if successful
  if (result) {
    await saveToCache(zipCode, result)
  }

  return result
}

/**
 * Smart geocoder that tries address first, then falls back to zip code
 * This is the main function to use for location resolution
 */
export async function geocodeLocation(
  address?: string,
  zipCode?: string
): Promise<GeocodeResult | null> {
  console.log('[Geocoding] Smart geocode - address:', address, 'zip:', zipCode)

  // Strategy 1: Try full address first if provided
  if (address && address.trim() !== '') {
    const addressResult = await geocodeAddress(address)
    if (addressResult) {
      console.log('[Geocoding] Successfully geocoded using address')
      return addressResult
    }

    console.log('[Geocoding] Address geocoding failed, trying zip code')
  }

  // Strategy 2: Fall back to zip code if address failed or not provided
  if (zipCode && zipCode.trim() !== '') {
    const zipResult = await geocodeZipCode(zipCode)
    if (zipResult) {
      console.log('[Geocoding] Successfully geocoded using zip code')
      return zipResult
    }

    console.log('[Geocoding] Zip code geocoding failed')
  }

  // Strategy 3: If both failed, return null
  console.log('[Geocoding] All geocoding strategies failed')
  return null
}

/**
 * Batch geocode multiple locations (useful for future optimizations)
 */
export async function batchGeocode(
  locations: Array<{ address?: string; zipCode?: string }>
): Promise<Array<GeocodeResult | null>> {
  const results: Array<GeocodeResult | null> = []

  for (const location of locations) {
    const result = await geocodeLocation(location.address, location.zipCode)
    results.push(result)
  }

  return results
}
