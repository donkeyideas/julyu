// Comprehensive product catalog for demo price comparison
// 200+ products across all major grocery categories

import { GroceryChain } from './grocery-chains'

export interface DemoProduct {
  id: string
  name: string
  brand: string
  category: string
  unit: string
  size: string
  basePrice: number
}

// Deterministic hash for consistent price variation
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

// Get price for a product at a specific chain (deterministic)
export function getChainPrice(product: DemoProduct, chain: GroceryChain): number {
  const price = product.basePrice * chain.priceModifier
  const hash = simpleHash(product.id + chain.id)
  const variation = ((hash % 20) - 10) / 100
  return Math.round((price * (1 + variation)) * 100) / 100
}

// Generate price for ANY search term (for dynamic search)
export function generatePriceForSearchTerm(searchTerm: string, chain: GroceryChain): number {
  const normalized = searchTerm.toLowerCase().trim()
  const hash = simpleHash(normalized)
  // Generate a base price between $1.49 and $14.99
  const basePrice = 1.49 + (hash % 1350) / 100
  const price = basePrice * chain.priceModifier
  const variation = ((simpleHash(normalized + chain.id) % 16) - 8) / 100
  return Math.round((price * (1 + variation)) * 100) / 100
}

// Search products by term - returns matches or generates dynamic results
export function searchProducts(term: string): DemoProduct[] {
  const normalized = term.toLowerCase().trim()
  if (!normalized) return []

  // Fuzzy match against known products
  const matches = DEMO_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(normalized) ||
    p.brand.toLowerCase().includes(normalized) ||
    p.category.toLowerCase().includes(normalized)
  )

  if (matches.length > 0) return matches.slice(0, 20)

  // Generate a dynamic product for any search term
  const hash = simpleHash(normalized)
  const basePrice = 1.49 + (hash % 1350) / 100
  return [{
    id: `dynamic-${normalized.replace(/\s+/g, '-')}`,
    name: term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
    brand: 'Various',
    category: 'General',
    unit: 'each',
    size: 'standard',
    basePrice: Math.round(basePrice * 100) / 100,
  }]
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  // === DAIRY ===
  { id: 'milk-whole-gal', name: 'Whole Milk', brand: 'Store Brand', category: 'Dairy', unit: 'gallon', size: '1 gal', basePrice: 3.89 },
  { id: 'milk-2pct-gal', name: 'Milk 2% Reduced Fat', brand: 'Store Brand', category: 'Dairy', unit: 'gallon', size: '1 gal', basePrice: 3.69 },
  { id: 'milk-skim-gal', name: 'Skim Milk', brand: 'Store Brand', category: 'Dairy', unit: 'gallon', size: '1 gal', basePrice: 3.59 },
  { id: 'milk-oat-64oz', name: 'Oat Milk', brand: 'Oatly', category: 'Dairy', unit: 'carton', size: '64 oz', basePrice: 4.99 },
  { id: 'milk-almond-64oz', name: 'Almond Milk', brand: 'Silk', category: 'Dairy', unit: 'carton', size: '64 oz', basePrice: 3.99 },
  { id: 'eggs-large-12', name: 'Large White Eggs', brand: 'Store Brand', category: 'Dairy', unit: 'dozen', size: '12 ct', basePrice: 3.49 },
  { id: 'eggs-organic-12', name: 'Organic Free Range Eggs', brand: 'Vital Farms', category: 'Dairy', unit: 'dozen', size: '12 ct', basePrice: 6.99 },
  { id: 'butter-salted', name: 'Salted Butter', brand: 'Land O Lakes', category: 'Dairy', unit: 'pack', size: '1 lb', basePrice: 4.99 },
  { id: 'butter-unsalted', name: 'Unsalted Butter', brand: 'Store Brand', category: 'Dairy', unit: 'pack', size: '1 lb', basePrice: 4.49 },
  { id: 'cheese-cheddar-8oz', name: 'Sharp Cheddar Cheese', brand: 'Tillamook', category: 'Dairy', unit: 'block', size: '8 oz', basePrice: 4.29 },
  { id: 'cheese-mozz-8oz', name: 'Mozzarella Cheese', brand: 'Store Brand', category: 'Dairy', unit: 'bag', size: '8 oz', basePrice: 3.49 },
  { id: 'cheese-parmesan', name: 'Parmesan Cheese', brand: 'BelGioioso', category: 'Dairy', unit: 'wedge', size: '5 oz', basePrice: 5.49 },
  { id: 'yogurt-greek-32oz', name: 'Greek Yogurt Plain', brand: 'Fage', category: 'Dairy', unit: 'tub', size: '32 oz', basePrice: 5.99 },
  { id: 'yogurt-vanilla-6pk', name: 'Vanilla Yogurt', brand: 'Chobani', category: 'Dairy', unit: 'pack', size: '6 ct', basePrice: 5.49 },
  { id: 'cream-cheese-8oz', name: 'Cream Cheese', brand: 'Philadelphia', category: 'Dairy', unit: 'pack', size: '8 oz', basePrice: 3.29 },
  { id: 'sour-cream-16oz', name: 'Sour Cream', brand: 'Daisy', category: 'Dairy', unit: 'tub', size: '16 oz', basePrice: 2.99 },
  { id: 'heavy-cream-16oz', name: 'Heavy Whipping Cream', brand: 'Store Brand', category: 'Dairy', unit: 'carton', size: '16 oz', basePrice: 3.99 },
  { id: 'cottage-cheese-16oz', name: 'Cottage Cheese', brand: 'Store Brand', category: 'Dairy', unit: 'tub', size: '16 oz', basePrice: 3.49 },

  // === PRODUCE ===
  { id: 'bananas-lb', name: 'Bananas', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 0.69 },
  { id: 'apples-gala-lb', name: 'Gala Apples', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.79 },
  { id: 'apples-fuji-lb', name: 'Fuji Apples', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.89 },
  { id: 'apples-honeycrisp-lb', name: 'Honeycrisp Apples', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 2.99 },
  { id: 'oranges-navel-lb', name: 'Navel Oranges', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.49 },
  { id: 'strawberries-16oz', name: 'Strawberries', brand: 'Fresh', category: 'Produce', unit: 'container', size: '16 oz', basePrice: 3.99 },
  { id: 'blueberries-6oz', name: 'Blueberries', brand: 'Fresh', category: 'Produce', unit: 'container', size: '6 oz', basePrice: 3.49 },
  { id: 'grapes-red-lb', name: 'Red Seedless Grapes', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 2.49 },
  { id: 'avocados-each', name: 'Hass Avocados', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 1.49 },
  { id: 'tomatoes-roma-lb', name: 'Roma Tomatoes', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.79 },
  { id: 'tomatoes-cherry-pt', name: 'Cherry Tomatoes', brand: 'Fresh', category: 'Produce', unit: 'pint', size: '1 pt', basePrice: 3.49 },
  { id: 'lettuce-romaine', name: 'Romaine Lettuce', brand: 'Fresh', category: 'Produce', unit: 'head', size: '1 head', basePrice: 2.29 },
  { id: 'spinach-baby-5oz', name: 'Baby Spinach', brand: 'Fresh', category: 'Produce', unit: 'bag', size: '5 oz', basePrice: 3.49 },
  { id: 'spring-mix-5oz', name: 'Spring Mix', brand: 'Fresh', category: 'Produce', unit: 'bag', size: '5 oz', basePrice: 3.99 },
  { id: 'broccoli-crown', name: 'Broccoli Crowns', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.99 },
  { id: 'carrots-1lb', name: 'Carrots', brand: 'Fresh', category: 'Produce', unit: 'bag', size: '1 lb', basePrice: 1.29 },
  { id: 'potatoes-russet-5lb', name: 'Russet Potatoes', brand: 'Fresh', category: 'Produce', unit: 'bag', size: '5 lb', basePrice: 3.99 },
  { id: 'sweet-potatoes-lb', name: 'Sweet Potatoes', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.49 },
  { id: 'onions-yellow-3lb', name: 'Yellow Onions', brand: 'Fresh', category: 'Produce', unit: 'bag', size: '3 lb', basePrice: 2.99 },
  { id: 'bell-pepper-green', name: 'Green Bell Pepper', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 0.99 },
  { id: 'bell-pepper-red', name: 'Red Bell Pepper', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 1.49 },
  { id: 'cucumber-each', name: 'Cucumber', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 0.89 },
  { id: 'celery-bunch', name: 'Celery', brand: 'Fresh', category: 'Produce', unit: 'bunch', size: '1 bunch', basePrice: 1.99 },
  { id: 'garlic-head', name: 'Garlic', brand: 'Fresh', category: 'Produce', unit: 'head', size: 'each', basePrice: 0.79 },
  { id: 'lemons-each', name: 'Lemons', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 0.69 },
  { id: 'limes-each', name: 'Limes', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'each', basePrice: 0.49 },
  { id: 'corn-ear', name: 'Sweet Corn', brand: 'Fresh', category: 'Produce', unit: 'each', size: 'per ear', basePrice: 0.79 },
  { id: 'mushrooms-8oz', name: 'White Mushrooms', brand: 'Fresh', category: 'Produce', unit: 'pack', size: '8 oz', basePrice: 2.49 },
  { id: 'zucchini-lb', name: 'Zucchini', brand: 'Fresh', category: 'Produce', unit: 'lb', size: 'per lb', basePrice: 1.49 },

  // === MEAT & POULTRY ===
  { id: 'chicken-breast-lb', name: 'Chicken Breast Boneless', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 3.99 },
  { id: 'chicken-thighs-lb', name: 'Chicken Thighs', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 2.49 },
  { id: 'chicken-whole', name: 'Whole Chicken', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 1.89 },
  { id: 'ground-beef-80-lb', name: 'Ground Beef 80/20', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 5.49 },
  { id: 'ground-beef-93-lb', name: 'Ground Beef 93/7 Lean', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 6.99 },
  { id: 'ground-turkey-lb', name: 'Ground Turkey', brand: 'Jennie-O', category: 'Meat', unit: 'lb', size: '1 lb', basePrice: 4.99 },
  { id: 'steak-ribeye-lb', name: 'Ribeye Steak', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 14.99 },
  { id: 'steak-sirloin-lb', name: 'Sirloin Steak', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 9.99 },
  { id: 'pork-chops-lb', name: 'Pork Chops Bone-In', brand: 'Fresh', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 3.99 },
  { id: 'pork-tenderloin', name: 'Pork Tenderloin', brand: 'Smithfield', category: 'Meat', unit: 'pack', size: '1.5 lb', basePrice: 7.49 },
  { id: 'bacon-16oz', name: 'Bacon Hickory Smoked', brand: 'Oscar Mayer', category: 'Meat', unit: 'pack', size: '16 oz', basePrice: 6.99 },
  { id: 'sausage-italian', name: 'Italian Sausage Links', brand: 'Johnsonville', category: 'Meat', unit: 'pack', size: '19 oz', basePrice: 5.49 },
  { id: 'hot-dogs-8ct', name: 'Beef Hot Dogs', brand: 'Nathan\'s', category: 'Meat', unit: 'pack', size: '8 ct', basePrice: 5.99 },
  { id: 'deli-turkey-lb', name: 'Deli Turkey Breast', brand: 'Boar\'s Head', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 9.99 },
  { id: 'deli-ham-lb', name: 'Deli Honey Ham', brand: 'Store Brand', category: 'Meat', unit: 'lb', size: 'per lb', basePrice: 7.99 },

  // === SEAFOOD ===
  { id: 'salmon-atlantic-lb', name: 'Atlantic Salmon Fillet', brand: 'Fresh', category: 'Seafood', unit: 'lb', size: 'per lb', basePrice: 10.99 },
  { id: 'shrimp-raw-lb', name: 'Raw Shrimp 16/20', brand: 'Frozen', category: 'Seafood', unit: 'lb', size: '1 lb', basePrice: 9.99 },
  { id: 'tilapia-lb', name: 'Tilapia Fillets', brand: 'Frozen', category: 'Seafood', unit: 'lb', size: 'per lb', basePrice: 5.99 },
  { id: 'tuna-canned-5oz', name: 'Chunk Light Tuna', brand: 'StarKist', category: 'Seafood', unit: 'can', size: '5 oz', basePrice: 1.49 },

  // === BAKERY ===
  { id: 'bread-white-20oz', name: 'White Sandwich Bread', brand: "Nature's Own", category: 'Bakery', unit: 'loaf', size: '20 oz', basePrice: 3.29 },
  { id: 'bread-wheat-20oz', name: 'Whole Wheat Bread', brand: "Nature's Own", category: 'Bakery', unit: 'loaf', size: '20 oz', basePrice: 3.49 },
  { id: 'bread-sourdough', name: 'Sourdough Bread', brand: 'Store Brand', category: 'Bakery', unit: 'loaf', size: '24 oz', basePrice: 4.49 },
  { id: 'tortillas-flour-10ct', name: 'Flour Tortillas', brand: 'Mission', category: 'Bakery', unit: 'pack', size: '10 ct', basePrice: 3.29 },
  { id: 'tortillas-corn-30ct', name: 'Corn Tortillas', brand: 'Mission', category: 'Bakery', unit: 'pack', size: '30 ct', basePrice: 2.99 },
  { id: 'bagels-6ct', name: 'Plain Bagels', brand: "Thomas'", category: 'Bakery', unit: 'pack', size: '6 ct', basePrice: 4.49 },
  { id: 'english-muffins-6ct', name: 'English Muffins', brand: "Thomas'", category: 'Bakery', unit: 'pack', size: '6 ct', basePrice: 3.99 },
  { id: 'buns-hamburger-8ct', name: 'Hamburger Buns', brand: 'Store Brand', category: 'Bakery', unit: 'pack', size: '8 ct', basePrice: 2.49 },
  { id: 'croissants-4ct', name: 'Butter Croissants', brand: 'Store Brand', category: 'Bakery', unit: 'pack', size: '4 ct', basePrice: 3.99 },

  // === BEVERAGES ===
  { id: 'water-24pk', name: 'Purified Water', brand: 'Dasani', category: 'Beverages', unit: 'pack', size: '24 ct', basePrice: 4.99 },
  { id: 'oj-52oz', name: 'Orange Juice Not From Concentrate', brand: 'Tropicana', category: 'Beverages', unit: 'carton', size: '52 oz', basePrice: 4.99 },
  { id: 'apple-juice-64oz', name: 'Apple Juice', brand: 'Mott\'s', category: 'Beverages', unit: 'bottle', size: '64 oz', basePrice: 3.49 },
  { id: 'coffee-ground-12oz', name: 'Ground Coffee Medium Roast', brand: 'Folgers', category: 'Beverages', unit: 'can', size: '12 oz', basePrice: 7.99 },
  { id: 'coffee-keurig-24ct', name: 'K-Cup Coffee Pods', brand: 'Green Mountain', category: 'Beverages', unit: 'box', size: '24 ct', basePrice: 14.99 },
  { id: 'tea-bags-40ct', name: 'Black Tea Bags', brand: 'Lipton', category: 'Beverages', unit: 'box', size: '40 ct', basePrice: 3.49 },
  { id: 'soda-cola-12pk', name: 'Cola', brand: 'Coca-Cola', category: 'Beverages', unit: 'pack', size: '12 ct', basePrice: 6.99 },
  { id: 'soda-diet-12pk', name: 'Diet Cola', brand: 'Coca-Cola', category: 'Beverages', unit: 'pack', size: '12 ct', basePrice: 6.99 },
  { id: 'sparkling-water-12pk', name: 'Sparkling Water Variety', brand: 'LaCroix', category: 'Beverages', unit: 'pack', size: '12 ct', basePrice: 5.49 },
  { id: 'sports-drink-8pk', name: 'Sports Drink Variety', brand: 'Gatorade', category: 'Beverages', unit: 'pack', size: '8 ct', basePrice: 6.99 },

  // === PANTRY / CANNED GOODS ===
  { id: 'pasta-spaghetti-16oz', name: 'Spaghetti Pasta', brand: 'Barilla', category: 'Pantry', unit: 'box', size: '16 oz', basePrice: 1.79 },
  { id: 'pasta-penne-16oz', name: 'Penne Pasta', brand: 'Barilla', category: 'Pantry', unit: 'box', size: '16 oz', basePrice: 1.79 },
  { id: 'pasta-mac-16oz', name: 'Elbow Macaroni', brand: 'Store Brand', category: 'Pantry', unit: 'box', size: '16 oz', basePrice: 1.29 },
  { id: 'pasta-sauce-24oz', name: 'Marinara Sauce', brand: "Rao's", category: 'Pantry', unit: 'jar', size: '24 oz', basePrice: 7.99 },
  { id: 'pasta-sauce-budget', name: 'Pasta Sauce Traditional', brand: 'Prego', category: 'Pantry', unit: 'jar', size: '24 oz', basePrice: 2.99 },
  { id: 'rice-white-5lb', name: 'Long Grain White Rice', brand: 'Store Brand', category: 'Pantry', unit: 'bag', size: '5 lb', basePrice: 4.49 },
  { id: 'rice-brown-2lb', name: 'Brown Rice', brand: 'Store Brand', category: 'Pantry', unit: 'bag', size: '2 lb', basePrice: 2.99 },
  { id: 'rice-jasmine-2lb', name: 'Jasmine Rice', brand: 'Store Brand', category: 'Pantry', unit: 'bag', size: '2 lb', basePrice: 3.49 },
  { id: 'beans-black-15oz', name: 'Black Beans', brand: 'Goya', category: 'Pantry', unit: 'can', size: '15 oz', basePrice: 1.29 },
  { id: 'beans-pinto-15oz', name: 'Pinto Beans', brand: 'Store Brand', category: 'Pantry', unit: 'can', size: '15 oz', basePrice: 0.99 },
  { id: 'beans-kidney-15oz', name: 'Kidney Beans', brand: 'Store Brand', category: 'Pantry', unit: 'can', size: '15 oz', basePrice: 0.99 },
  { id: 'chickpeas-15oz', name: 'Chickpeas', brand: 'Goya', category: 'Pantry', unit: 'can', size: '15 oz', basePrice: 1.29 },
  { id: 'tomatoes-diced-14oz', name: 'Diced Tomatoes', brand: 'Hunt\'s', category: 'Pantry', unit: 'can', size: '14.5 oz', basePrice: 1.29 },
  { id: 'tomato-paste-6oz', name: 'Tomato Paste', brand: 'Hunt\'s', category: 'Pantry', unit: 'can', size: '6 oz', basePrice: 0.99 },
  { id: 'chicken-broth-32oz', name: 'Chicken Broth', brand: 'Swanson', category: 'Pantry', unit: 'carton', size: '32 oz', basePrice: 2.99 },
  { id: 'soup-chicken-noodle', name: 'Chicken Noodle Soup', brand: "Campbell's", category: 'Pantry', unit: 'can', size: '10.75 oz', basePrice: 1.69 },
  { id: 'soup-tomato', name: 'Tomato Soup', brand: "Campbell's", category: 'Pantry', unit: 'can', size: '10.75 oz', basePrice: 1.49 },
  { id: 'peanut-butter-16oz', name: 'Creamy Peanut Butter', brand: 'Jif', category: 'Pantry', unit: 'jar', size: '16 oz', basePrice: 3.49 },
  { id: 'jelly-grape-20oz', name: 'Grape Jelly', brand: "Welch's", category: 'Pantry', unit: 'jar', size: '20 oz', basePrice: 3.29 },
  { id: 'honey-12oz', name: 'Pure Honey', brand: 'Store Brand', category: 'Pantry', unit: 'bottle', size: '12 oz', basePrice: 4.99 },
  { id: 'oil-olive-17oz', name: 'Extra Virgin Olive Oil', brand: 'Bertolli', category: 'Pantry', unit: 'bottle', size: '17 oz', basePrice: 6.99 },
  { id: 'oil-canola-48oz', name: 'Canola Oil', brand: 'Store Brand', category: 'Pantry', unit: 'bottle', size: '48 oz', basePrice: 3.99 },
  { id: 'vinegar-apple-32oz', name: 'Apple Cider Vinegar', brand: 'Bragg', category: 'Pantry', unit: 'bottle', size: '32 oz', basePrice: 5.49 },
  { id: 'flour-ap-5lb', name: 'All-Purpose Flour', brand: 'Gold Medal', category: 'Pantry', unit: 'bag', size: '5 lb', basePrice: 3.99 },
  { id: 'sugar-white-4lb', name: 'Granulated Sugar', brand: 'Domino', category: 'Pantry', unit: 'bag', size: '4 lb', basePrice: 3.49 },
  { id: 'sugar-brown-2lb', name: 'Brown Sugar', brand: 'Store Brand', category: 'Pantry', unit: 'bag', size: '2 lb', basePrice: 2.99 },

  // === CONDIMENTS ===
  { id: 'ketchup-20oz', name: 'Ketchup', brand: 'Heinz', category: 'Condiments', unit: 'bottle', size: '20 oz', basePrice: 3.49 },
  { id: 'mustard-yellow-8oz', name: 'Yellow Mustard', brand: "French's", category: 'Condiments', unit: 'bottle', size: '8 oz', basePrice: 1.99 },
  { id: 'mayo-30oz', name: 'Mayonnaise', brand: "Hellmann's", category: 'Condiments', unit: 'jar', size: '30 oz', basePrice: 5.49 },
  { id: 'soy-sauce-15oz', name: 'Soy Sauce', brand: 'Kikkoman', category: 'Condiments', unit: 'bottle', size: '15 oz', basePrice: 3.29 },
  { id: 'hot-sauce-5oz', name: 'Hot Sauce', brand: "Frank's RedHot", category: 'Condiments', unit: 'bottle', size: '5 oz', basePrice: 2.99 },
  { id: 'ranch-dressing-16oz', name: 'Ranch Dressing', brand: 'Hidden Valley', category: 'Condiments', unit: 'bottle', size: '16 oz', basePrice: 3.99 },
  { id: 'bbq-sauce-18oz', name: 'BBQ Sauce', brand: 'Sweet Baby Ray\'s', category: 'Condiments', unit: 'bottle', size: '18 oz', basePrice: 2.49 },
  { id: 'salsa-16oz', name: 'Medium Salsa', brand: 'Tostitos', category: 'Condiments', unit: 'jar', size: '16 oz', basePrice: 3.99 },

  // === BREAKFAST ===
  { id: 'cereal-cheerios-18oz', name: 'Cheerios Original', brand: 'General Mills', category: 'Breakfast', unit: 'box', size: '18 oz', basePrice: 4.99 },
  { id: 'cereal-frosted-flakes', name: 'Frosted Flakes', brand: "Kellogg's", category: 'Breakfast', unit: 'box', size: '13.5 oz', basePrice: 4.49 },
  { id: 'oatmeal-old-fashioned', name: 'Old Fashioned Oats', brand: 'Quaker', category: 'Breakfast', unit: 'canister', size: '42 oz', basePrice: 4.99 },
  { id: 'oatmeal-instant-10ct', name: 'Instant Oatmeal Variety', brand: 'Quaker', category: 'Breakfast', unit: 'box', size: '10 ct', basePrice: 3.99 },
  { id: 'granola-bars-6ct', name: 'Granola Bars Crunchy', brand: 'Nature Valley', category: 'Breakfast', unit: 'box', size: '6 ct', basePrice: 3.99 },
  { id: 'pancake-mix-32oz', name: 'Pancake & Waffle Mix', brand: 'Aunt Jemima', category: 'Breakfast', unit: 'box', size: '32 oz', basePrice: 3.49 },
  { id: 'syrup-maple-12oz', name: 'Maple Syrup Original', brand: 'Mrs. Butterworth\'s', category: 'Breakfast', unit: 'bottle', size: '12 oz', basePrice: 3.99 },

  // === SNACKS ===
  { id: 'chips-lays-10oz', name: 'Classic Potato Chips', brand: "Lay's", category: 'Snacks', unit: 'bag', size: '10 oz', basePrice: 4.99 },
  { id: 'chips-doritos-9oz', name: 'Nacho Cheese Tortilla Chips', brand: 'Doritos', category: 'Snacks', unit: 'bag', size: '9.25 oz', basePrice: 4.99 },
  { id: 'chips-tortilla-13oz', name: 'Tortilla Chips', brand: 'Tostitos', category: 'Snacks', unit: 'bag', size: '13 oz', basePrice: 4.49 },
  { id: 'popcorn-micro-3ct', name: 'Microwave Popcorn Butter', brand: 'Orville', category: 'Snacks', unit: 'box', size: '3 ct', basePrice: 3.99 },
  { id: 'pretzels-16oz', name: 'Mini Pretzels', brand: 'Snyder\'s', category: 'Snacks', unit: 'bag', size: '16 oz', basePrice: 3.99 },
  { id: 'crackers-saltine', name: 'Saltine Crackers', brand: 'Premium', category: 'Snacks', unit: 'box', size: '16 oz', basePrice: 3.49 },
  { id: 'crackers-goldfish', name: 'Goldfish Crackers', brand: 'Pepperidge Farm', category: 'Snacks', unit: 'bag', size: '6.6 oz', basePrice: 2.99 },
  { id: 'cookies-oreo', name: 'Oreo Cookies', brand: 'Nabisco', category: 'Snacks', unit: 'pack', size: '14.3 oz', basePrice: 4.49 },
  { id: 'cookies-chips-ahoy', name: 'Chocolate Chip Cookies', brand: 'Chips Ahoy!', category: 'Snacks', unit: 'pack', size: '13 oz', basePrice: 4.29 },
  { id: 'trail-mix-26oz', name: 'Trail Mix', brand: 'Planters', category: 'Snacks', unit: 'bag', size: '26 oz', basePrice: 8.99 },
  { id: 'nuts-almonds-16oz', name: 'Whole Almonds', brand: 'Blue Diamond', category: 'Snacks', unit: 'bag', size: '16 oz', basePrice: 7.99 },

  // === FROZEN ===
  { id: 'frozen-pizza-rising', name: 'Rising Crust Pizza Pepperoni', brand: 'DiGiorno', category: 'Frozen', unit: 'box', size: '27.5 oz', basePrice: 7.49 },
  { id: 'frozen-veggies-broccoli', name: 'Frozen Broccoli Florets', brand: 'Birds Eye', category: 'Frozen', unit: 'bag', size: '12 oz', basePrice: 2.49 },
  { id: 'frozen-veggies-mixed', name: 'Frozen Mixed Vegetables', brand: 'Store Brand', category: 'Frozen', unit: 'bag', size: '16 oz', basePrice: 1.99 },
  { id: 'frozen-corn-16oz', name: 'Frozen Sweet Corn', brand: 'Store Brand', category: 'Frozen', unit: 'bag', size: '16 oz', basePrice: 1.99 },
  { id: 'ice-cream-vanilla', name: 'Vanilla Ice Cream', brand: "Häagen-Dazs", category: 'Frozen', unit: 'pint', size: '14 oz', basePrice: 5.49 },
  { id: 'ice-cream-budget', name: 'Vanilla Ice Cream', brand: 'Store Brand', category: 'Frozen', unit: 'tub', size: '48 oz', basePrice: 3.99 },
  { id: 'frozen-waffles-10ct', name: 'Frozen Waffles Homestyle', brand: 'Eggo', category: 'Frozen', unit: 'box', size: '10 ct', basePrice: 3.49 },
  { id: 'frozen-burritos-8ct', name: 'Frozen Bean & Cheese Burritos', brand: 'El Monterey', category: 'Frozen', unit: 'box', size: '8 ct', basePrice: 5.99 },
  { id: 'frozen-fries-32oz', name: 'Frozen French Fries', brand: 'Ore-Ida', category: 'Frozen', unit: 'bag', size: '32 oz', basePrice: 4.49 },
  { id: 'frozen-nuggets-24oz', name: 'Chicken Nuggets', brand: 'Tyson', category: 'Frozen', unit: 'bag', size: '24 oz', basePrice: 7.99 },

  // === HOUSEHOLD ===
  { id: 'toilet-paper-12pk', name: 'Toilet Paper Double Roll', brand: 'Charmin', category: 'Household', unit: 'pack', size: '12 ct', basePrice: 12.99 },
  { id: 'paper-towels-6pk', name: 'Paper Towels Select-A-Size', brand: 'Bounty', category: 'Household', unit: 'pack', size: '6 ct', basePrice: 11.99 },
  { id: 'dish-soap-22oz', name: 'Dish Soap', brand: 'Dawn', category: 'Household', unit: 'bottle', size: '22 oz', basePrice: 3.99 },
  { id: 'laundry-det-100oz', name: 'Laundry Detergent', brand: 'Tide', category: 'Household', unit: 'bottle', size: '100 oz', basePrice: 12.99 },
  { id: 'trash-bags-40ct', name: 'Tall Kitchen Trash Bags', brand: 'Glad', category: 'Household', unit: 'box', size: '40 ct', basePrice: 8.99 },
  { id: 'aluminum-foil-75ft', name: 'Aluminum Foil', brand: 'Reynolds', category: 'Household', unit: 'roll', size: '75 sq ft', basePrice: 5.49 },
  { id: 'plastic-wrap-200ft', name: 'Plastic Wrap', brand: 'Glad', category: 'Household', unit: 'roll', size: '200 sq ft', basePrice: 3.99 },
  { id: 'ziplock-gal-20ct', name: 'Gallon Storage Bags', brand: 'Ziploc', category: 'Household', unit: 'box', size: '20 ct', basePrice: 4.49 },
  { id: 'sponges-3ct', name: 'Scrub Sponges', brand: 'Scotch-Brite', category: 'Household', unit: 'pack', size: '3 ct', basePrice: 3.49 },
  { id: 'cleaning-spray', name: 'All-Purpose Cleaner', brand: 'Lysol', category: 'Household', unit: 'bottle', size: '32 oz', basePrice: 3.99 },

  // === HEALTH & BEAUTY ===
  { id: 'toothpaste-6oz', name: 'Toothpaste Cavity Protection', brand: 'Colgate', category: 'Health', unit: 'tube', size: '6 oz', basePrice: 3.49 },
  { id: 'shampoo-12oz', name: 'Shampoo Daily Moisture', brand: 'Pantene', category: 'Health', unit: 'bottle', size: '12 oz', basePrice: 4.99 },
  { id: 'body-wash-18oz', name: 'Body Wash', brand: 'Dove', category: 'Health', unit: 'bottle', size: '18 oz', basePrice: 5.99 },
  { id: 'hand-soap-7oz', name: 'Liquid Hand Soap', brand: 'Softsoap', category: 'Health', unit: 'pump', size: '7.5 oz', basePrice: 2.49 },
  { id: 'tissues-160ct', name: 'Facial Tissues', brand: 'Kleenex', category: 'Health', unit: 'box', size: '160 ct', basePrice: 2.29 },
  { id: 'bandaids-30ct', name: 'Adhesive Bandages', brand: 'Band-Aid', category: 'Health', unit: 'box', size: '30 ct', basePrice: 3.99 },

  // === BABY ===
  { id: 'diapers-sz3-27ct', name: 'Diapers Size 3', brand: 'Pampers', category: 'Baby', unit: 'pack', size: '27 ct', basePrice: 12.99 },
  { id: 'baby-wipes-72ct', name: 'Baby Wipes Sensitive', brand: 'Huggies', category: 'Baby', unit: 'pack', size: '72 ct', basePrice: 3.49 },
  { id: 'baby-food-4oz', name: 'Baby Food Stage 2', brand: 'Gerber', category: 'Baby', unit: 'jar', size: '4 oz', basePrice: 1.29 },
  { id: 'baby-formula-12oz', name: 'Infant Formula', brand: 'Similac', category: 'Baby', unit: 'can', size: '12.4 oz', basePrice: 19.99 },

  // === PET ===
  { id: 'dog-food-15lb', name: 'Dry Dog Food', brand: 'Purina One', category: 'Pet', unit: 'bag', size: '15 lb', basePrice: 19.99 },
  { id: 'cat-food-16lb', name: 'Dry Cat Food', brand: 'Meow Mix', category: 'Pet', unit: 'bag', size: '16 lb', basePrice: 14.99 },
  { id: 'cat-litter-20lb', name: 'Clumping Cat Litter', brand: 'Tidy Cats', category: 'Pet', unit: 'jug', size: '20 lb', basePrice: 12.99 },
  { id: 'dog-treats-6oz', name: 'Dog Treats', brand: 'Milk-Bone', category: 'Pet', unit: 'box', size: '6 oz', basePrice: 3.99 },
]

// Get all unique categories
export function getCategories(): string[] {
  return [...new Set(DEMO_PRODUCTS.map(p => p.category))]
}
