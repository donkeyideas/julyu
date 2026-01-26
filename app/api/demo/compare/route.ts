import { NextRequest, NextResponse } from 'next/server'

// Fixed demo data - realistic prices for common grocery items
const DEMO_PRODUCTS: Record<string, { name: string; brand: string; prices: Record<string, number> }> = {
  'milk 2%': {
    name: 'Milk 2% Reduced Fat',
    brand: 'Kroger',
    prices: { kroger: 3.49, walmart: 3.28, target: 3.79 }
  },
  'eggs organic': {
    name: 'Organic Large Brown Eggs',
    brand: 'Simple Truth',
    prices: { kroger: 5.99, walmart: 5.47, target: 6.29 }
  },
  'bread whole wheat': {
    name: 'Whole Wheat Bread',
    brand: 'Nature\'s Own',
    prices: { kroger: 3.29, walmart: 2.98, target: 3.49 }
  },
  'apples gala': {
    name: 'Gala Apples (3 lb bag)',
    brand: 'Fresh',
    prices: { kroger: 4.49, walmart: 3.97, target: 4.99 }
  },
  'chicken breast': {
    name: 'Boneless Skinless Chicken Breast',
    brand: 'Fresh',
    prices: { kroger: 8.99, walmart: 7.94, target: 9.49 }
  },
  'pasta penne': {
    name: 'Penne Pasta 16oz',
    brand: 'Barilla',
    prices: { kroger: 1.69, walmart: 1.47, target: 1.89 }
  }
}

const STORES = {
  kroger: { id: 'kroger-demo', name: 'Kroger', retailer: 'kroger', distance: '2.1' },
  walmart: { id: 'walmart-demo', name: 'Walmart Supercenter', retailer: 'walmart', distance: '3.4' },
  target: { id: 'target-demo', name: 'Target', retailer: 'target', distance: '4.2' }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, zipCode } = body

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please provide items to compare' }, { status: 400 })
    }

    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json({ error: 'Please enter a valid 5-digit zip code' }, { status: 400 })
    }

    // Calculate totals for each store
    const storeTotals: Record<string, { total: number; items: any[] }> = {
      kroger: { total: 0, items: [] },
      walmart: { total: 0, items: [] },
      target: { total: 0, items: [] }
    }

    const products: any[] = []
    let itemsFound = 0

    for (const item of items) {
      const itemLower = item.toLowerCase().trim()
      const productData = DEMO_PRODUCTS[itemLower]

      if (productData) {
        itemsFound++

        // Add to each store's list
        for (const [store, price] of Object.entries(productData.prices)) {
          storeTotals[store].total += price
          storeTotals[store].items.push({
            name: productData.name,
            price,
            available: true
          })
        }

        // Use Kroger price for the products list
        products.push({
          userInput: item,
          name: productData.name,
          brand: productData.brand,
          price: productData.prices.kroger,
          available: true
        })
      } else {
        // Item not in our demo data - show as not found but still include
        products.push({
          userInput: item,
          name: item,
          brand: null,
          price: null,
          available: false
        })
      }
    }

    // Find best store (lowest total)
    const storeOptions = Object.entries(storeTotals)
      .map(([key, data]) => ({
        store: STORES[key as keyof typeof STORES],
        total: data.total,
        items: data.items
      }))
      .sort((a, b) => a.total - b.total)

    const bestOption = storeOptions[0]
    const alternatives = storeOptions.slice(1)

    // Calculate savings vs average
    const avgTotal = storeOptions.reduce((sum, s) => sum + s.total, 0) / storeOptions.length
    const savings = avgTotal - bestOption.total

    return NextResponse.json({
      success: true,
      dataSource: 'demo',
      bestOption: {
        ...bestOption,
        savings: Number(savings.toFixed(2))
      },
      alternatives,
      products,
      summary: {
        totalItems: items.length,
        itemsFound,
        itemsMissing: items.length - itemsFound,
        estimatedTotal: Number(bestOption.total.toFixed(2)),
        storesSearched: 3
      }
    })
  } catch (error) {
    console.error('Demo compare error:', error)
    return NextResponse.json({ error: 'Failed to compare prices' }, { status: 500 })
  }
}
