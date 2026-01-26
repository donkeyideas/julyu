import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Demo Data Seeder - Populates all dashboard tables with realistic sample data
 * POST /api/demo/seed - Seeds data for the authenticated user
 * DELETE /api/demo/seed - Clears all demo data for the user
 */

// Sample stores
const STORES = [
  { name: 'Kroger Marketplace', chain: 'Kroger', address: '123 Main St' },
  { name: 'Kroger', chain: 'Kroger', address: '456 Oak Ave' },
  { name: 'Walmart Supercenter', chain: 'Walmart', address: '789 Pine Rd' },
  { name: 'Target', chain: 'Target', address: '321 Elm St' },
  { name: 'Whole Foods', chain: 'Whole Foods', address: '654 Maple Dr' },
]

// Sample products with realistic prices
const PRODUCTS = [
  { name: 'Organic Whole Milk', brand: 'Horizon', category: 'Dairy', basePrice: 5.99 },
  { name: 'Large Eggs', brand: 'Eggland\'s Best', category: 'Dairy', basePrice: 4.49 },
  { name: 'Whole Wheat Bread', brand: 'Nature\'s Own', category: 'Pantry Staples', basePrice: 3.99 },
  { name: 'Chicken Breast', brand: 'Tyson', category: 'Meat & Seafood', basePrice: 8.99 },
  { name: 'Gala Apples', brand: 'Generic', category: 'Produce', basePrice: 1.49 },
  { name: 'Bananas', brand: 'Dole', category: 'Produce', basePrice: 0.59 },
  { name: 'Pasta Penne', brand: 'Barilla', category: 'Pantry Staples', basePrice: 1.89 },
  { name: 'Olive Oil', brand: 'Bertolli', category: 'Pantry Staples', basePrice: 8.99 },
  { name: 'Greek Yogurt', brand: 'Chobani', category: 'Dairy', basePrice: 1.29 },
  { name: 'Cheddar Cheese', brand: 'Tillamook', category: 'Dairy', basePrice: 5.49 },
  { name: 'Ground Beef', brand: 'Generic', category: 'Meat & Seafood', basePrice: 6.99 },
  { name: 'Atlantic Salmon', brand: 'Generic', category: 'Meat & Seafood', basePrice: 12.99 },
  { name: 'Broccoli', brand: 'Generic', category: 'Produce', basePrice: 2.49 },
  { name: 'Carrots', brand: 'Generic', category: 'Produce', basePrice: 1.99 },
  { name: 'Orange Juice', brand: 'Tropicana', category: 'Snacks & Beverages', basePrice: 4.99 },
  { name: 'Coffee', brand: 'Folgers', category: 'Snacks & Beverages', basePrice: 9.99 },
  { name: 'Potato Chips', brand: 'Lay\'s', category: 'Snacks & Beverages', basePrice: 4.29 },
  { name: 'Paper Towels', brand: 'Bounty', category: 'Household', basePrice: 12.99 },
  { name: 'Dish Soap', brand: 'Dawn', category: 'Household', basePrice: 3.49 },
  { name: 'Frozen Pizza', brand: 'DiGiorno', category: 'Frozen Foods', basePrice: 7.99 },
]

// Generate random date within last N days
function randomDate(daysBack: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
  return date
}

// Generate random price variation
function variedPrice(basePrice: number): number {
  const variation = (Math.random() - 0.5) * 0.4 // ±20% variation
  return Math.round((basePrice * (1 + variation)) * 100) / 100
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Allow test mode
    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: Record<string, number> = {}

    // 1. Create stores if they don't exist
    for (const store of STORES) {
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('name', store.name)
        .single()

      if (!existing) {
        await supabase.from('stores').insert({
          name: store.name,
          chain: store.chain,
          address: store.address,
          city: 'Cincinnati',
          state: 'OH',
          zip_code: '45202',
        })
      }
    }
    results.stores = STORES.length

    // Get store IDs
    const { data: storeData } = await supabase.from('stores').select('id, name')
    const storeIds = storeData?.map((s: { id: string; name: string }) => s.id) || []

    // 2. Create products
    const productIds: string[] = []
    for (const product of PRODUCTS) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .single()

      if (existing) {
        productIds.push(existing.id)
      } else {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: product.name,
            brand: product.brand,
            category: product.category,
          })
          .select('id')
          .single()

        if (newProduct) {
          productIds.push(newProduct.id)
        }
      }
    }
    results.products = productIds.length

    // 3. Create prices for products at different stores
    let priceCount = 0
    for (let i = 0; i < productIds.length; i++) {
      const product = PRODUCTS[i]
      // Add price for 2-3 random stores
      const numStores = 2 + Math.floor(Math.random() * 2)
      const shuffledStores = [...storeIds].sort(() => Math.random() - 0.5).slice(0, numStores)

      for (const storeId of shuffledStores) {
        const { error } = await supabase.from('prices').insert({
          product_id: productIds[i],
          store_id: storeId,
          price: variedPrice(product.basePrice),
          recorded_at: randomDate(30).toISOString(),
        })
        if (!error) priceCount++
      }
    }
    results.prices = priceCount

    // 4. Create shopping lists
    const listNames = [
      'Weekly Groceries',
      'Party Supplies',
      'Healthy Meal Prep',
      'Quick Dinners',
    ]

    const listIds: string[] = []
    for (const name of listNames) {
      const { data: list } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: userId,
          name,
          created_at: randomDate(60).toISOString(),
        })
        .select('id')
        .single()

      if (list) {
        listIds.push(list.id)

        // Add 4-8 random items to each list
        const numItems = 4 + Math.floor(Math.random() * 5)
        const shuffledProducts = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, numItems)

        for (const product of shuffledProducts) {
          await supabase.from('list_items').insert({
            list_id: list.id,
            user_input: product.name,
            quantity: 1 + Math.floor(Math.random() * 3),
          })
        }
      }
    }
    results.shopping_lists = listIds.length

    // 5. Create comparisons
    let compCount = 0
    for (let i = 0; i < 5; i++) {
      const listId = listIds[Math.floor(Math.random() * listIds.length)]
      const store = STORES[Math.floor(Math.random() * STORES.length)]
      const numItems = 4 + Math.floor(Math.random() * 6)
      const total = 25 + Math.random() * 75
      const savings = 5 + Math.random() * 15

      const { error } = await supabase.from('comparisons').insert({
        user_id: userId,
        list_id: listId,
        results: {
          stores: STORES.slice(0, 3).map(s => ({
            name: s.name,
            total: total + (Math.random() - 0.5) * 20
          })),
          summary: {
            totalItems: numItems,
            itemsFound: numItems - Math.floor(Math.random() * 2),
            estimatedTotal: total,
            storesSearched: 3,
          }
        },
        best_option: {
          store: { name: store.name, retailer: store.chain },
          total: Math.round(total * 100) / 100,
        },
        total_savings: Math.round(savings * 100) / 100,
        created_at: randomDate(30).toISOString(),
      })
      if (!error) compCount++
    }
    results.comparisons = compCount

    // 6. Create receipts with OCR data
    let receiptCount = 0
    for (let i = 0; i < 8; i++) {
      const store = STORES[Math.floor(Math.random() * STORES.length)]
      const numItems = 5 + Math.floor(Math.random() * 10)
      const items = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, numItems)
      const total = items.reduce((sum, p) => sum + variedPrice(p.basePrice), 0)

      const { error } = await supabase.from('receipts').insert({
        user_id: userId,
        store_name: store.name,
        total_amount: Math.round(total * 100) / 100,
        purchase_date: randomDate(60).toISOString(),
        ocr_status: 'complete',
        ocr_result: {
          store: { name: store.name },
          items: items.map(p => ({
            name: p.name,
            description: p.name,
            price: variedPrice(p.basePrice),
            amount: variedPrice(p.basePrice),
            category: p.category,
            quantity: 1,
          })),
          total: Math.round(total * 100) / 100,
        },
      })
      if (!error) receiptCount++
    }
    results.receipts = receiptCount

    // 7. Create user_savings for last 6 months
    let savingsCount = 0
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.toISOString().slice(0, 7) + '-01'

      const totalSpent = 200 + Math.random() * 300
      const totalSaved = 15 + Math.random() * 40
      const trips = 3 + Math.floor(Math.random() * 5)

      // Check if exists
      const { data: existing } = await supabase
        .from('user_savings')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .single()

      if (!existing) {
        const { error } = await supabase.from('user_savings').insert({
          user_id: userId,
          month,
          total_spent: Math.round(totalSpent * 100) / 100,
          total_saved: Math.round(totalSaved * 100) / 100,
          trips_count: trips,
          avg_savings_per_trip: Math.round((totalSaved / trips) * 100) / 100,
        })
        if (!error) savingsCount++
      }
    }
    results.user_savings = savingsCount

    // 8. Create price alerts
    let alertCount = 0
    const alertProducts = PRODUCTS.slice(0, 4)
    for (const product of alertProducts) {
      const productId = productIds[PRODUCTS.indexOf(product)]
      const targetPrice = product.basePrice * 0.8 // 20% below base
      const currentPrice = variedPrice(product.basePrice)

      const { error } = await supabase.from('price_alerts').insert({
        user_id: userId,
        product_id: productId,
        target_price: Math.round(targetPrice * 100) / 100,
        current_price: Math.round(currentPrice * 100) / 100,
        is_active: true,
      })
      if (!error) alertCount++
    }
    results.price_alerts = alertCount

    // 9. Create AI insights
    const insights = [
      {
        insight_type: 'savings',
        title: 'Great savings this week!',
        content: 'You saved $23.50 compared to last week by shopping at Kroger instead of Whole Foods.',
        priority: 2,
        action_url: '/dashboard/savings',
      },
      {
        insight_type: 'spending',
        title: 'Dairy spending increased',
        content: 'Your dairy spending is up 15% this month. Consider switching to store brands to save $8-12 monthly.',
        priority: 3,
        action_url: '/dashboard/budget',
      },
      {
        insight_type: 'recommendation',
        title: 'Best day to shop',
        content: 'Based on your history, Wednesday mornings offer the best combination of fresh stock and short lines at your preferred stores.',
        priority: 1,
      },
      {
        insight_type: 'alert',
        title: 'Price drop on Chicken Breast',
        content: 'Tyson Chicken Breast is now $6.99/lb at Kroger - $2 below your target price!',
        priority: 4,
        action_url: '/dashboard/alerts',
      },
      {
        insight_type: 'prediction',
        title: 'Upcoming price increase',
        content: 'Coffee prices typically rise 10-15% in February. Consider stocking up now.',
        priority: 2,
      },
    ]

    let insightCount = 0
    for (const insight of insights) {
      const { error } = await supabase.from('ai_insights').insert({
        user_id: userId,
        ...insight,
        dismissed: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      if (!error) insightCount++
    }
    results.ai_insights = insightCount

    // 10. Create user budgets
    const budgets = [
      { category: 'Produce', monthly_limit: 100 },
      { category: 'Dairy', monthly_limit: 60 },
      { category: 'Meat & Seafood', monthly_limit: 120 },
      { category: 'Pantry Staples', monthly_limit: 80 },
      { category: 'Snacks & Beverages', monthly_limit: 50 },
      { category: 'Household', monthly_limit: 40 },
      { category: 'Frozen Foods', monthly_limit: 30 },
    ]

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    let budgetCount = 0
    for (const budget of budgets) {
      const { error } = await supabase.from('user_budgets').insert({
        user_id: userId,
        category: budget.category,
        monthly_limit: budget.monthly_limit,
        month: currentMonth,
      })
      if (!error) budgetCount++
    }
    results.user_budgets = budgetCount

    // 11. Create budget recommendations
    const recommendations = [
      {
        recommendation_type: 'substitution',
        title: 'Switch to store-brand milk',
        description: 'Save $1.50 per gallon by switching from Horizon to Kroger brand organic milk.',
        potential_savings: 6.00,
      },
      {
        recommendation_type: 'timing',
        title: 'Buy chicken on Tuesdays',
        description: 'Kroger typically marks down chicken by 30% on Tuesday evenings.',
        potential_savings: 8.00,
      },
      {
        recommendation_type: 'bulk',
        title: 'Buy pasta in bulk',
        description: 'The 5-pack of Barilla pasta at Costco saves 40% per box compared to individual purchases.',
        potential_savings: 4.50,
      },
    ]

    let recCount = 0
    for (const rec of recommendations) {
      const { error } = await supabase.from('budget_recommendations').insert({
        user_id: userId,
        ...rec,
        dismissed: false,
        implemented: false,
      })
      if (!error) recCount++
    }
    results.budget_recommendations = recCount

    // 12. Create user preferences
    const { error: prefError } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      notifications_enabled: true,
      price_alert_notifications: true,
      weekly_summary: true,
      ai_features_enabled: true,
      budget_monthly: 500,
      shopping_frequency: 'weekly',
    })
    if (!prefError) results.user_preferences = 1

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      results,
    })
  } catch (error: any) {
    console.error('[Demo Seed] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isTestMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

    const userId = user?.id || (isTestMode ? 'test-user-id' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete in order to respect foreign keys
    await supabase.from('budget_recommendations').delete().eq('user_id', userId)
    await supabase.from('user_budgets').delete().eq('user_id', userId)
    await supabase.from('ai_insights').delete().eq('user_id', userId)
    await supabase.from('price_alerts').delete().eq('user_id', userId)
    await supabase.from('user_savings').delete().eq('user_id', userId)
    await supabase.from('receipts').delete().eq('user_id', userId)
    await supabase.from('comparisons').delete().eq('user_id', userId)

    // Get list IDs first
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', userId)

    if (lists) {
      for (const list of lists) {
        await supabase.from('list_items').delete().eq('list_id', list.id)
      }
    }

    await supabase.from('shopping_lists').delete().eq('user_id', userId)
    await supabase.from('user_preferences').delete().eq('user_id', userId)

    return NextResponse.json({
      success: true,
      message: 'Demo data cleared successfully',
    })
  } catch (error: any) {
    console.error('[Demo Clear] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clear demo data' },
      { status: 500 }
    )
  }
}
