// Mock receipt data for demo users
// All dates are relative to now so data always looks fresh

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

export interface Receipt {
  id: string
  store_name: string
  date: string
  total: number
  items_count: number
  items: ReceiptItem[]
  status: 'processed'
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const DEMO_RECEIPTS: Receipt[] = [
  {
    id: 'rct-001',
    store_name: 'Kroger',
    date: daysAgo(1),
    total: 67.43,
    items_count: 11,
    status: 'processed',
    items: [
      { name: 'Whole Milk (1 gal)', quantity: 1, price: 3.79 },
      { name: 'Large Eggs (dozen)', quantity: 1, price: 3.49 },
      { name: 'Chicken Breast (2 lb)', quantity: 1, price: 9.98 },
      { name: 'Bananas (1 bunch)', quantity: 1, price: 1.29 },
      { name: 'Baby Spinach (5 oz)', quantity: 2, price: 3.49 },
      { name: 'Greek Yogurt (32 oz)', quantity: 1, price: 5.99 },
      { name: 'Whole Wheat Bread', quantity: 1, price: 3.29 },
      { name: 'Cheddar Cheese (8 oz)', quantity: 1, price: 3.99 },
      { name: 'Pasta Sauce (24 oz)', quantity: 2, price: 3.49 },
      { name: 'Ground Turkey (1 lb)', quantity: 1, price: 5.49 },
      { name: 'Brown Rice (2 lb)', quantity: 1, price: 3.29 },
    ],
  },
  {
    id: 'rct-002',
    store_name: 'Walmart',
    date: daysAgo(3),
    total: 89.17,
    items_count: 14,
    status: 'processed',
    items: [
      { name: 'Ground Beef 80/20 (1 lb)', quantity: 2, price: 4.78 },
      { name: 'Hamburger Buns (8 ct)', quantity: 1, price: 2.24 },
      { name: 'American Cheese Singles', quantity: 1, price: 3.47 },
      { name: 'Ketchup (20 oz)', quantity: 1, price: 2.98 },
      { name: 'Mustard (14 oz)', quantity: 1, price: 1.48 },
      { name: 'Potato Chips (10 oz)', quantity: 2, price: 3.48 },
      { name: 'Cola (12 pack)', quantity: 1, price: 5.98 },
      { name: 'Ice Cream (48 oz)', quantity: 1, price: 4.97 },
      { name: 'Paper Towels (6 roll)', quantity: 1, price: 8.97 },
      { name: 'Dish Soap (19 oz)', quantity: 1, price: 3.47 },
      { name: 'Laundry Detergent (50 oz)', quantity: 1, price: 9.97 },
      { name: 'Trash Bags (30 ct)', quantity: 1, price: 7.97 },
      { name: 'Aluminum Foil (75 ft)', quantity: 1, price: 4.48 },
      { name: 'Butter (1 lb)', quantity: 1, price: 3.97 },
    ],
  },
  {
    id: 'rct-003',
    store_name: 'Target',
    date: daysAgo(5),
    total: 52.86,
    items_count: 8,
    status: 'processed',
    items: [
      { name: 'Organic Almond Milk (64 oz)', quantity: 1, price: 4.29 },
      { name: 'Kind Granola Bars (6 ct)', quantity: 2, price: 5.49 },
      { name: 'Avocados (bag of 4)', quantity: 1, price: 4.99 },
      { name: 'Hummus (10 oz)', quantity: 1, price: 4.29 },
      { name: 'Pita Chips (7 oz)', quantity: 1, price: 3.99 },
      { name: 'Trail Mix (26 oz)', quantity: 1, price: 8.99 },
      { name: 'Sparkling Water (8 pack)', quantity: 1, price: 4.49 },
      { name: 'Dark Chocolate Bar (3.5 oz)', quantity: 2, price: 3.99 },
    ],
  },
  {
    id: 'rct-004',
    store_name: 'Publix',
    date: daysAgo(7),
    total: 74.52,
    items_count: 10,
    status: 'processed',
    items: [
      { name: 'Pub Sub - Turkey & Provolone', quantity: 2, price: 8.99 },
      { name: 'Boar\'s Head Deli Turkey (1 lb)', quantity: 1, price: 9.99 },
      { name: 'Swiss Cheese (8 oz)', quantity: 1, price: 4.99 },
      { name: 'Sourdough Bread', quantity: 1, price: 4.49 },
      { name: 'Rotisserie Chicken', quantity: 1, price: 8.99 },
      { name: 'Caesar Salad Kit', quantity: 1, price: 4.29 },
      { name: 'Strawberries (16 oz)', quantity: 1, price: 4.49 },
      { name: 'Blueberries (6 oz)', quantity: 1, price: 3.99 },
      { name: 'Orange Juice (52 oz)', quantity: 1, price: 4.79 },
      { name: 'Bakery Cookies (12 ct)', quantity: 1, price: 5.99 },
    ],
  },
  {
    id: 'rct-005',
    store_name: 'Kroger',
    date: daysAgo(10),
    total: 58.24,
    items_count: 9,
    status: 'processed',
    items: [
      { name: 'Salmon Fillet (1 lb)', quantity: 1, price: 9.99 },
      { name: 'Asparagus (1 bunch)', quantity: 1, price: 3.49 },
      { name: 'Lemon (each)', quantity: 2, price: 0.69 },
      { name: 'Olive Oil (17 oz)', quantity: 1, price: 7.49 },
      { name: 'Garlic (3 ct)', quantity: 1, price: 1.99 },
      { name: 'Jasmine Rice (2 lb)', quantity: 1, price: 4.29 },
      { name: 'Broccoli Crowns (1 lb)', quantity: 1, price: 2.49 },
      { name: 'Sweet Potatoes (3 lb)', quantity: 1, price: 3.99 },
      { name: 'Soy Sauce (15 oz)', quantity: 1, price: 3.29 },
    ],
  },
  {
    id: 'rct-006',
    store_name: 'Walmart',
    date: daysAgo(12),
    total: 43.67,
    items_count: 8,
    status: 'processed',
    items: [
      { name: 'Cereal - Cheerios (18 oz)', quantity: 1, price: 4.48 },
      { name: 'Peanut Butter (16 oz)', quantity: 1, price: 3.28 },
      { name: 'Grape Jelly (20 oz)', quantity: 1, price: 2.98 },
      { name: 'White Bread (loaf)', quantity: 2, price: 2.24 },
      { name: 'Apple Juice (64 oz)', quantity: 1, price: 3.47 },
      { name: 'Goldfish Crackers (30 oz)', quantity: 1, price: 8.97 },
      { name: 'String Cheese (12 ct)', quantity: 1, price: 4.97 },
      { name: 'Baby Carrots (1 lb)', quantity: 1, price: 1.98 },
    ],
  },
  {
    id: 'rct-007',
    store_name: 'Target',
    date: daysAgo(15),
    total: 61.38,
    items_count: 9,
    status: 'processed',
    items: [
      { name: 'Coffee Beans (12 oz)', quantity: 1, price: 9.99 },
      { name: 'Half & Half (32 oz)', quantity: 1, price: 4.29 },
      { name: 'Oat Milk (64 oz)', quantity: 1, price: 4.49 },
      { name: 'Frozen Pizza (2 pack)', quantity: 2, price: 7.99 },
      { name: 'Frozen Veggie Stir Fry (16 oz)', quantity: 1, price: 3.49 },
      { name: 'Tortillas (10 ct)', quantity: 1, price: 3.29 },
      { name: 'Salsa (16 oz)', quantity: 1, price: 3.99 },
      { name: 'Sour Cream (16 oz)', quantity: 1, price: 2.79 },
      { name: 'Shredded Mozzarella (8 oz)', quantity: 1, price: 3.49 },
    ],
  },
  {
    id: 'rct-008',
    store_name: 'Publix',
    date: daysAgo(18),
    total: 82.95,
    items_count: 12,
    status: 'processed',
    items: [
      { name: 'NY Strip Steak (1 lb)', quantity: 2, price: 12.99 },
      { name: 'Baking Potatoes (5 lb)', quantity: 1, price: 4.99 },
      { name: 'Fresh Green Beans (1 lb)', quantity: 1, price: 2.99 },
      { name: 'Corn on the Cob (4 ct)', quantity: 1, price: 3.49 },
      { name: 'Dinner Rolls (12 ct)', quantity: 1, price: 3.99 },
      { name: 'Butter (1 lb)', quantity: 1, price: 4.99 },
      { name: 'Heavy Cream (16 oz)', quantity: 1, price: 4.49 },
      { name: 'Garlic Bread', quantity: 1, price: 3.49 },
      { name: 'Mixed Greens (5 oz)', quantity: 1, price: 3.99 },
      { name: 'Cherry Tomatoes (pint)', quantity: 1, price: 3.49 },
      { name: 'Ranch Dressing (16 oz)', quantity: 1, price: 3.99 },
      { name: 'Lemonade (64 oz)', quantity: 1, price: 3.29 },
    ],
  },
  {
    id: 'rct-009',
    store_name: 'Kroger',
    date: daysAgo(21),
    total: 55.19,
    items_count: 10,
    status: 'processed',
    items: [
      { name: 'Tilapia Fillets (1 lb)', quantity: 1, price: 6.99 },
      { name: 'Shrimp (1 lb)', quantity: 1, price: 8.99 },
      { name: 'Cocktail Sauce (12 oz)', quantity: 1, price: 2.99 },
      { name: 'Coleslaw Mix (14 oz)', quantity: 1, price: 2.49 },
      { name: 'Hush Puppy Mix (8 oz)', quantity: 1, price: 1.99 },
      { name: 'Vegetable Oil (48 oz)', quantity: 1, price: 4.49 },
      { name: 'Lemons (bag of 6)', quantity: 1, price: 3.49 },
      { name: 'Tartar Sauce (12 oz)', quantity: 1, price: 2.99 },
      { name: 'French Fries (frozen, 32 oz)', quantity: 1, price: 4.29 },
      { name: 'Sweet Tea (gallon)', quantity: 1, price: 2.99 },
    ],
  },
  {
    id: 'rct-010',
    store_name: 'Walmart',
    date: daysAgo(25),
    total: 71.84,
    items_count: 13,
    status: 'processed',
    items: [
      { name: 'Boneless Pork Chops (2 lb)', quantity: 1, price: 7.96 },
      { name: 'Instant Mashed Potatoes (8 ct)', quantity: 1, price: 3.48 },
      { name: 'Canned Green Beans (4 ct)', quantity: 1, price: 3.24 },
      { name: 'Canned Corn (4 ct)', quantity: 1, price: 3.24 },
      { name: 'Applesauce (6 ct)', quantity: 1, price: 2.97 },
      { name: 'Mac & Cheese (5 ct)', quantity: 1, price: 4.48 },
      { name: 'Chicken Noodle Soup (4 ct)', quantity: 1, price: 4.48 },
      { name: 'Ramen Noodles (12 ct)', quantity: 1, price: 2.98 },
      { name: 'Flour (5 lb)', quantity: 1, price: 3.48 },
      { name: 'Sugar (4 lb)', quantity: 1, price: 3.97 },
      { name: 'Baking Powder (8.1 oz)', quantity: 1, price: 2.47 },
      { name: 'Vanilla Extract (2 oz)', quantity: 1, price: 4.97 },
      { name: 'Chocolate Chips (12 oz)', quantity: 1, price: 2.98 },
    ],
  },
]
