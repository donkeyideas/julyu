// All major US grocery chains with realistic metadata
// Used by the demo system for price comparison

export interface GroceryChain {
  id: string
  name: string
  priceTier: 'budget' | 'value' | 'standard' | 'premium'
  priceModifier: number // Multiplier relative to base price (1.0 = average)
  regions: string[] // US regions where present
  storeCount: string
  color: string // Brand color hex
  category: 'supermarket' | 'warehouse' | 'discount' | 'specialty' | 'organic'
}

// Regions: national, northeast, southeast, midwest, south, west, mid_atlantic, texas, plains

export const GROCERY_CHAINS: GroceryChain[] = [
  // National Chains
  { id: 'walmart', name: 'Walmart', priceTier: 'budget', priceModifier: 0.88, regions: ['national'], storeCount: '4,700+', color: '#0071CE', category: 'supermarket' },
  { id: 'kroger', name: 'Kroger', priceTier: 'value', priceModifier: 0.95, regions: ['midwest', 'south', 'west', 'southeast'], storeCount: '2,700+', color: '#E31837', category: 'supermarket' },
  { id: 'costco', name: 'Costco', priceTier: 'budget', priceModifier: 0.82, regions: ['national'], storeCount: '590+', color: '#005DAA', category: 'warehouse' },
  { id: 'target', name: 'Target', priceTier: 'standard', priceModifier: 1.02, regions: ['national'], storeCount: '1,950+', color: '#CC0000', category: 'supermarket' },
  { id: 'aldi', name: 'ALDI', priceTier: 'budget', priceModifier: 0.78, regions: ['northeast', 'midwest', 'south', 'southeast', 'mid_atlantic'], storeCount: '2,300+', color: '#00005F', category: 'discount' },
  { id: 'trader-joes', name: "Trader Joe's", priceTier: 'value', priceModifier: 0.92, regions: ['national'], storeCount: '560+', color: '#DA291C', category: 'specialty' },
  { id: 'whole-foods', name: 'Whole Foods Market', priceTier: 'premium', priceModifier: 1.25, regions: ['national'], storeCount: '500+', color: '#00674B', category: 'organic' },
  { id: 'sams-club', name: "Sam's Club", priceTier: 'budget', priceModifier: 0.84, regions: ['national'], storeCount: '600+', color: '#0060A9', category: 'warehouse' },

  // Regional Powerhouses
  { id: 'publix', name: 'Publix', priceTier: 'standard', priceModifier: 1.05, regions: ['southeast'], storeCount: '1,350+', color: '#3F8F29', category: 'supermarket' },
  { id: 'heb', name: 'H-E-B', priceTier: 'value', priceModifier: 0.90, regions: ['texas', 'south'], storeCount: '420+', color: '#EE3A24', category: 'supermarket' },
  { id: 'meijer', name: 'Meijer', priceTier: 'value', priceModifier: 0.93, regions: ['midwest'], storeCount: '260+', color: '#D22630', category: 'supermarket' },
  { id: 'wegmans', name: 'Wegmans', priceTier: 'premium', priceModifier: 1.15, regions: ['northeast', 'mid_atlantic'], storeCount: '110+', color: '#003DA5', category: 'supermarket' },

  // Regional Chains
  { id: 'safeway', name: 'Safeway', priceTier: 'standard', priceModifier: 1.05, regions: ['west', 'mid_atlantic'], storeCount: '900+', color: '#E21A2C', category: 'supermarket' },
  { id: 'food-lion', name: 'Food Lion', priceTier: 'budget', priceModifier: 0.85, regions: ['southeast', 'mid_atlantic'], storeCount: '1,100+', color: '#FF6600', category: 'supermarket' },
  { id: 'giant', name: 'Giant Food', priceTier: 'standard', priceModifier: 1.00, regions: ['mid_atlantic'], storeCount: '190+', color: '#ED1C24', category: 'supermarket' },
  { id: 'shoprite', name: 'ShopRite', priceTier: 'value', priceModifier: 0.94, regions: ['northeast'], storeCount: '300+', color: '#005DAA', category: 'supermarket' },
  { id: 'stop-and-shop', name: 'Stop & Shop', priceTier: 'standard', priceModifier: 1.03, regions: ['northeast'], storeCount: '400+', color: '#E31837', category: 'supermarket' },
  { id: 'harris-teeter', name: 'Harris Teeter', priceTier: 'standard', priceModifier: 1.08, regions: ['southeast', 'mid_atlantic'], storeCount: '260+', color: '#DB2428', category: 'supermarket' },
  { id: 'winco', name: 'WinCo Foods', priceTier: 'budget', priceModifier: 0.80, regions: ['west'], storeCount: '140+', color: '#E31837', category: 'discount' },
  { id: 'sprouts', name: 'Sprouts Farmers Market', priceTier: 'standard', priceModifier: 1.10, regions: ['national'], storeCount: '400+', color: '#6A9C3A', category: 'organic' },
  { id: 'lidl', name: 'Lidl', priceTier: 'budget', priceModifier: 0.79, regions: ['northeast', 'southeast', 'mid_atlantic'], storeCount: '170+', color: '#0050AA', category: 'discount' },
  { id: 'albertsons', name: 'Albertsons', priceTier: 'standard', priceModifier: 1.04, regions: ['west', 'south'], storeCount: '2,200+', color: '#0073CF', category: 'supermarket' },
  { id: 'food-4-less', name: 'Food 4 Less', priceTier: 'budget', priceModifier: 0.83, regions: ['west', 'midwest'], storeCount: '280+', color: '#E31837', category: 'discount' },
  { id: 'piggly-wiggly', name: 'Piggly Wiggly', priceTier: 'value', priceModifier: 0.91, regions: ['southeast', 'south', 'midwest'], storeCount: '530+', color: '#E31837', category: 'supermarket' },
  { id: 'hy-vee', name: 'Hy-Vee', priceTier: 'standard', priceModifier: 1.01, regions: ['midwest', 'plains'], storeCount: '280+', color: '#E31837', category: 'supermarket' },
  { id: 'winn-dixie', name: 'Winn-Dixie', priceTier: 'value', priceModifier: 0.94, regions: ['southeast'], storeCount: '500+', color: '#E31837', category: 'supermarket' },
  { id: 'market-basket', name: 'Market Basket', priceTier: 'budget', priceModifier: 0.82, regions: ['northeast'], storeCount: '90+', color: '#E31837', category: 'supermarket' },
  { id: 'hannaford', name: 'Hannaford', priceTier: 'value', priceModifier: 0.96, regions: ['northeast'], storeCount: '180+', color: '#006341', category: 'supermarket' },
  { id: 'bi-lo', name: 'Grocery Outlet', priceTier: 'budget', priceModifier: 0.76, regions: ['west', 'northeast', 'mid_atlantic'], storeCount: '430+', color: '#E31837', category: 'discount' },
]

// Map zip code prefixes to regions for demo filtering
export const ZIP_TO_REGION: Record<string, string[]> = {
  '0': ['northeast'],
  '1': ['northeast', 'mid_atlantic'],
  '2': ['mid_atlantic', 'southeast'],
  '3': ['southeast', 'south'],
  '4': ['midwest'],
  '5': ['midwest', 'plains'],
  '6': ['midwest', 'plains'],
  '7': ['south', 'texas'],
  '8': ['west'],
  '9': ['west'],
}

export function getChainsForZip(zipCode: string): GroceryChain[] {
  if (!zipCode || zipCode.length < 1) return GROCERY_CHAINS
  const firstDigit = zipCode[0]
  const regions = ZIP_TO_REGION[firstDigit] || []
  return GROCERY_CHAINS.filter(
    chain => chain.regions.includes('national') || chain.regions.some(r => regions.includes(r))
  )
}
