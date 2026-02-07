// Mock shopping list data for demo users
// All dates are relative to now so data always looks fresh

export interface ListItem {
  name: string
  quantity: number
  checked: boolean
  estimated_price: number
}

export interface ShoppingList {
  id: string
  name: string
  created_at: string
  updated_at: string
  items: ListItem[]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function hoursAgo(hours: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

export const DEMO_LISTS: ShoppingList[] = [
  {
    id: 'list-001',
    name: 'Weekly Groceries',
    created_at: daysAgo(2),
    updated_at: hoursAgo(3),
    items: [
      { name: 'Whole Milk (1 gal)', quantity: 1, checked: true, estimated_price: 3.79 },
      { name: 'Large Eggs (dozen)', quantity: 1, checked: true, estimated_price: 3.49 },
      { name: 'Bananas (1 bunch)', quantity: 1, checked: false, estimated_price: 1.29 },
      { name: 'Chicken Breast (2 lb)', quantity: 1, checked: false, estimated_price: 9.98 },
      { name: 'Baby Spinach (5 oz)', quantity: 2, checked: false, estimated_price: 3.49 },
      { name: 'Whole Wheat Bread', quantity: 1, checked: true, estimated_price: 3.29 },
      { name: 'Greek Yogurt (32 oz)', quantity: 1, checked: false, estimated_price: 5.99 },
      { name: 'Apples (3 lb bag)', quantity: 1, checked: false, estimated_price: 4.99 },
      { name: 'Cheddar Cheese (8 oz)', quantity: 1, checked: true, estimated_price: 3.99 },
      { name: 'Pasta Sauce (24 oz)', quantity: 1, checked: false, estimated_price: 3.49 },
      { name: 'Ground Turkey (1 lb)', quantity: 1, checked: false, estimated_price: 5.49 },
      { name: 'Brown Rice (2 lb)', quantity: 1, checked: false, estimated_price: 3.29 },
    ],
  },
  {
    id: 'list-002',
    name: 'BBQ Party',
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
    items: [
      { name: 'Ground Beef 80/20 (3 lb)', quantity: 1, checked: false, estimated_price: 14.37 },
      { name: 'Hot Dogs (8 ct)', quantity: 2, checked: false, estimated_price: 4.49 },
      { name: 'Hamburger Buns (8 ct)', quantity: 2, checked: false, estimated_price: 2.49 },
      { name: 'Hot Dog Buns (8 ct)', quantity: 2, checked: false, estimated_price: 2.49 },
      { name: 'American Cheese Singles', quantity: 1, checked: true, estimated_price: 3.99 },
      { name: 'Ketchup (20 oz)', quantity: 1, checked: true, estimated_price: 3.29 },
      { name: 'Mustard (14 oz)', quantity: 1, checked: true, estimated_price: 1.99 },
      { name: 'Potato Chips (party size)', quantity: 1, checked: false, estimated_price: 5.99 },
      { name: 'Cole Slaw Mix (14 oz)', quantity: 2, checked: false, estimated_price: 2.99 },
      { name: 'Baked Beans (28 oz)', quantity: 2, checked: false, estimated_price: 2.79 },
      { name: 'Corn on the Cob (8 ct)', quantity: 1, checked: false, estimated_price: 4.99 },
      { name: 'Lemonade (gallon)', quantity: 2, checked: false, estimated_price: 3.49 },
      { name: 'Cola (12 pack)', quantity: 2, checked: false, estimated_price: 6.49 },
      { name: 'Charcoal (15 lb)', quantity: 1, checked: true, estimated_price: 9.99 },
      { name: 'Paper Plates (50 ct)', quantity: 1, checked: false, estimated_price: 4.99 },
      { name: 'Plastic Cups (50 ct)', quantity: 1, checked: false, estimated_price: 3.99 },
    ],
  },
  {
    id: 'list-003',
    name: 'Healthy Meal Prep',
    created_at: daysAgo(3),
    updated_at: hoursAgo(8),
    items: [
      { name: 'Chicken Breast (3 lb)', quantity: 1, checked: false, estimated_price: 12.99 },
      { name: 'Salmon Fillet (1 lb)', quantity: 1, checked: false, estimated_price: 9.99 },
      { name: 'Brown Rice (2 lb)', quantity: 1, checked: true, estimated_price: 3.29 },
      { name: 'Quinoa (16 oz)', quantity: 1, checked: false, estimated_price: 5.49 },
      { name: 'Broccoli Crowns (1 lb)', quantity: 2, checked: false, estimated_price: 2.49 },
      { name: 'Sweet Potatoes (3 lb)', quantity: 1, checked: false, estimated_price: 3.99 },
      { name: 'Baby Spinach (10 oz)', quantity: 1, checked: false, estimated_price: 4.99 },
      { name: 'Bell Peppers (3 ct)', quantity: 1, checked: false, estimated_price: 3.49 },
      { name: 'Avocados (4 ct)', quantity: 1, checked: true, estimated_price: 4.99 },
      { name: 'Cherry Tomatoes (pint)', quantity: 1, checked: false, estimated_price: 3.49 },
      { name: 'Olive Oil (17 oz)', quantity: 1, checked: true, estimated_price: 7.49 },
      { name: 'Lemon (each)', quantity: 4, checked: false, estimated_price: 0.69 },
    ],
  },
  {
    id: 'list-004',
    name: 'Baby Essentials',
    created_at: daysAgo(7),
    updated_at: daysAgo(2),
    items: [
      { name: 'Baby Formula (22 oz)', quantity: 2, checked: false, estimated_price: 18.99 },
      { name: 'Diapers Size 2 (84 ct)', quantity: 1, checked: false, estimated_price: 24.99 },
      { name: 'Baby Wipes (3 pack)', quantity: 1, checked: true, estimated_price: 6.99 },
      { name: 'Baby Food - Bananas (4 oz)', quantity: 6, checked: false, estimated_price: 1.29 },
      { name: 'Baby Food - Sweet Potato (4 oz)', quantity: 6, checked: false, estimated_price: 1.29 },
      { name: 'Baby Food - Peas (4 oz)', quantity: 4, checked: false, estimated_price: 1.29 },
      { name: 'Baby Cereal (8 oz)', quantity: 1, checked: false, estimated_price: 3.99 },
      { name: 'Teething Biscuits (12 ct)', quantity: 1, checked: false, estimated_price: 4.49 },
      { name: 'Baby Shampoo (13.6 oz)', quantity: 1, checked: true, estimated_price: 5.99 },
      { name: 'Diaper Cream (4 oz)', quantity: 1, checked: false, estimated_price: 7.99 },
    ],
  },
]
