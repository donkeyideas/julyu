/**
 * Deep Link Generator Service
 * Generates pre-populated shopping URLs for delivery partners
 */

interface DeliveryPartner {
  id: string
  name: string
  slug: string
  base_url: string
  deep_link_template: string | null
  affiliate_base_url: string | null
  affiliate_id: string | null
  supports_deep_linking: boolean | null
  supports_search_url: boolean | null
}

interface StoreInfo {
  store: string
  retailer?: string
  address?: string
  total: number
  zipCode?: string
}

interface CartItem {
  userInput?: string
  name?: string
  price?: number
  quantity?: number
}

/**
 * Generate a deep link URL for a delivery partner
 * Pre-populates the shopping cart or search with items
 */
export function generateDeepLink(
  partner: DeliveryPartner,
  store: StoreInfo,
  items: CartItem[]
): string {
  // Build search query from items
  // For Shipt, use only the first item (multi-item search breaks their URL)
  const isShipt = partner.slug === 'shipt'
  const itemsForSearch = isShipt ? items.slice(0, 1) : items
  const searchTerms = itemsForSearch
    .map(item => {
      const name = item.userInput || item.name || ''
      // Include quantity if more than 1
      if (item.quantity && item.quantity > 1) {
        return `${name} (${item.quantity})`
      }
      return name
    })
    .filter(Boolean)
    .join(', ')

  // If no deep link template, just return base URL
  if (!partner.deep_link_template) {
    return partner.base_url
  }

  // Get retailer slug for template
  const retailerSlug = getRetailerSlug(store.retailer || store.store)

  // Apply template placeholders
  let url = partner.deep_link_template

  // Replace all placeholders
  url = url
    .replace('{retailer}', encodeURIComponent(retailerSlug))
    .replace('{search}', encodeURIComponent(searchTerms))
    .replace('{items}', encodeURIComponent(searchTerms))
    .replace('{zipCode}', encodeURIComponent(store.zipCode || ''))
    .replace('{affiliateId}', encodeURIComponent(partner.affiliate_id || ''))
    .replace('{store}', encodeURIComponent(store.store))

  // If the URL still has unreplaced placeholders, clean them up
  url = url.replace(/\{[^}]+\}/g, '')

  // Remove any double slashes (except after protocol)
  url = url.replace(/([^:])\/\//g, '$1/')

  // Remove trailing slash if search params exist
  if (url.includes('?')) {
    url = url.replace(/\/\?/, '?')
  }

  // Apply affiliate redirect if configured
  if (partner.affiliate_base_url && partner.affiliate_id) {
    url = `${partner.affiliate_base_url}?url=${encodeURIComponent(url)}&id=${partner.affiliate_id}`
  }

  return url
}

/**
 * Convert store name to retailer slug
 * Used for deep link templates that require retailer identifiers
 */
function getRetailerSlug(storeName: string): string {
  if (!storeName) return ''

  // Known retailer mappings
  const retailerMappings: Record<string, string> = {
    'kroger': 'kroger',
    'safeway': 'safeway',
    'publix': 'publix',
    'costco': 'costco',
    'aldi': 'aldi',
    'walmart': 'walmart',
    'target': 'target',
    'whole foods': 'whole-foods',
    'wholefoods': 'whole-foods',
    'amazon fresh': 'amazon-fresh',
    'amazonfresh': 'amazon-fresh',
    'trader joe\'s': 'trader-joes',
    'trader joes': 'trader-joes',
    'meijer': 'meijer',
    'h-e-b': 'heb',
    'heb': 'heb',
    'albertsons': 'albertsons',
    'vons': 'vons',
    'ralphs': 'ralphs',
    'food lion': 'food-lion',
    'giant': 'giant',
    'stop & shop': 'stop-and-shop',
    'cvs': 'cvs',
    'walgreens': 'walgreens',
    '7-eleven': '7-eleven',
    'sprouts': 'sprouts',
    'wegmans': 'wegmans',
    'harris teeter': 'harris-teeter',
    'fry\'s': 'frys',
    'frys': 'frys',
    'food 4 less': 'food4less',
    'food4less': 'food4less',
    'qfc': 'qfc',
    'smiths': 'smiths',
    'king soopers': 'king-soopers',
    'fred meyer': 'fred-meyer'
  }

  // Normalize store name
  const normalized = storeName.toLowerCase().trim()

  // Check direct mapping
  if (retailerMappings[normalized]) {
    return retailerMappings[normalized]
  }

  // Check if store name contains a known retailer
  for (const [key, slug] of Object.entries(retailerMappings)) {
    if (normalized.includes(key)) {
      return slug
    }
  }

  // Fallback: slugify the store name
  return normalized
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Get partner-specific deep link info
 */
export function getPartnerDeepLinkInfo(partnerSlug: string): {
  supportsSearch: boolean
  supportsCart: boolean
  searchParam: string
  notes: string
} {
  const partnerInfo: Record<string, {
    supportsSearch: boolean
    supportsCart: boolean
    searchParam: string
    notes: string
  }> = {
    'instacart': {
      supportsSearch: true,
      supportsCart: false,
      searchParam: 'search',
      notes: 'Search by store name, items shown in search'
    },
    'shipt': {
      supportsSearch: true,
      supportsCart: false,
      searchParam: 'q',
      notes: 'Supports search query parameter'
    },
    'doordash': {
      supportsSearch: false,
      supportsCart: false,
      searchParam: '',
      notes: 'Deep linking requires partnership integration'
    },
    'walmart': {
      supportsSearch: true,
      supportsCart: false,
      searchParam: 'q',
      notes: 'Search with grocery category filter'
    },
    'amazon': {
      supportsSearch: true,
      supportsCart: false,
      searchParam: 'k',
      notes: 'Search within Amazon Fresh department'
    }
  }

  return partnerInfo[partnerSlug] || {
    supportsSearch: false,
    supportsCart: false,
    searchParam: '',
    notes: 'Unknown partner'
  }
}
