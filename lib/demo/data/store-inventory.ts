// Demo Store Inventory Data
// All dates are relative to new Date() so data always looks fresh.

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  stock_quantity: number;
  in_stock: boolean;
  custom_size: string;
  updated_at: string;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const DEMO_INVENTORY: InventoryItem[] = [
  // ─── Beverages (20 items) ───────────────────────────────────────────
  { id: "inv-001", name: "Poland Spring Water 16.9oz", brand: "Poland Spring", category: "Beverages", sku: "SKU-001", sale_price: 1.99, cost_price: 0.65, stock_quantity: 72, in_stock: true, custom_size: "16.9 oz", updated_at: hoursAgo(3) },
  { id: "inv-002", name: "Coca-Cola Classic 20oz", brand: "Coca-Cola", category: "Beverages", sku: "SKU-002", sale_price: 2.49, cost_price: 1.10, stock_quantity: 48, in_stock: true, custom_size: "20 oz", updated_at: hoursAgo(5) },
  { id: "inv-003", name: "Pepsi 20oz", brand: "Pepsi", category: "Beverages", sku: "SKU-003", sale_price: 2.49, cost_price: 1.10, stock_quantity: 36, in_stock: true, custom_size: "20 oz", updated_at: daysAgo(1) },
  { id: "inv-004", name: "Gatorade Cool Blue 28oz", brand: "Gatorade", category: "Beverages", sku: "SKU-004", sale_price: 2.99, cost_price: 1.40, stock_quantity: 24, in_stock: true, custom_size: "28 oz", updated_at: daysAgo(1) },
  { id: "inv-005", name: "Arizona Iced Tea 23oz", brand: "Arizona", category: "Beverages", sku: "SKU-005", sale_price: 1.29, cost_price: 0.55, stock_quantity: 60, in_stock: true, custom_size: "23 oz", updated_at: hoursAgo(8) },
  { id: "inv-006", name: "Red Bull Energy 8.4oz", brand: "Red Bull", category: "Beverages", sku: "SKU-006", sale_price: 3.99, cost_price: 2.20, stock_quantity: 30, in_stock: true, custom_size: "8.4 oz", updated_at: daysAgo(2) },
  { id: "inv-007", name: "Monster Energy Original 16oz", brand: "Monster", category: "Beverages", sku: "SKU-007", sale_price: 3.49, cost_price: 1.85, stock_quantity: 18, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(2) },
  { id: "inv-008", name: "Tropicana Orange Juice 15.2oz", brand: "Tropicana", category: "Beverages", sku: "SKU-008", sale_price: 2.99, cost_price: 1.50, stock_quantity: 15, in_stock: true, custom_size: "15.2 oz", updated_at: daysAgo(1) },
  { id: "inv-009", name: "Snapple Peach Tea 16oz", brand: "Snapple", category: "Beverages", sku: "SKU-009", sale_price: 2.49, cost_price: 1.15, stock_quantity: 20, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(3) },
  { id: "inv-010", name: "Sprite 20oz", brand: "Coca-Cola", category: "Beverages", sku: "SKU-010", sale_price: 2.49, cost_price: 1.10, stock_quantity: 30, in_stock: true, custom_size: "20 oz", updated_at: hoursAgo(6) },
  { id: "inv-011", name: "Vitamin Water XXX 20oz", brand: "Glaceau", category: "Beverages", sku: "SKU-011", sale_price: 2.79, cost_price: 1.25, stock_quantity: 12, in_stock: true, custom_size: "20 oz", updated_at: daysAgo(2) },
  { id: "inv-012", name: "Coca-Cola 2 Liter", brand: "Coca-Cola", category: "Beverages", sku: "SKU-012", sale_price: 3.49, cost_price: 1.60, stock_quantity: 10, in_stock: true, custom_size: "2 L", updated_at: daysAgo(1) },
  { id: "inv-013", name: "Brisk Iced Tea Lemon 1L", brand: "Brisk", category: "Beverages", sku: "SKU-013", sale_price: 1.99, cost_price: 0.80, stock_quantity: 24, in_stock: true, custom_size: "1 L", updated_at: daysAgo(3) },
  { id: "inv-014", name: "Jarritos Mandarin 12.5oz", brand: "Jarritos", category: "Beverages", sku: "SKU-014", sale_price: 1.79, cost_price: 0.70, stock_quantity: 36, in_stock: true, custom_size: "12.5 oz", updated_at: daysAgo(2) },
  { id: "inv-015", name: "Yoo-Hoo Chocolate Drink 6.5oz", brand: "Yoo-Hoo", category: "Beverages", sku: "SKU-015", sale_price: 1.49, cost_price: 0.60, stock_quantity: 2, in_stock: true, custom_size: "6.5 oz", updated_at: daysAgo(5) },
  { id: "inv-016", name: "Coconut Water 11.1oz", brand: "Vita Coco", category: "Beverages", sku: "SKU-016", sale_price: 2.99, cost_price: 1.45, stock_quantity: 8, in_stock: true, custom_size: "11.1 oz", updated_at: daysAgo(1) },
  { id: "inv-017", name: "Coffee Bustelo Instant 7.05oz", brand: "Bustelo", category: "Beverages", sku: "SKU-017", sale_price: 5.99, cost_price: 3.20, stock_quantity: 14, in_stock: true, custom_size: "7.05 oz", updated_at: daysAgo(4) },
  { id: "inv-018", name: "Fanta Orange 20oz", brand: "Coca-Cola", category: "Beverages", sku: "SKU-018", sale_price: 2.49, cost_price: 1.10, stock_quantity: 0, in_stock: false, custom_size: "20 oz", updated_at: daysAgo(6) },
  { id: "inv-019", name: "Body Armor Strawberry Banana 16oz", brand: "Body Armor", category: "Beverages", sku: "SKU-019", sale_price: 2.99, cost_price: 1.50, stock_quantity: 16, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(1) },
  { id: "inv-020", name: "Modelo Especial 24oz Can", brand: "Modelo", category: "Beverages", sku: "SKU-020", sale_price: 3.99, cost_price: 2.10, stock_quantity: 24, in_stock: true, custom_size: "24 oz", updated_at: hoursAgo(12) },

  // ─── Snacks (22 items) ──────────────────────────────────────────────
  { id: "inv-021", name: "Lay's Classic Potato Chips", brand: "Lay's", category: "Snacks", sku: "SKU-021", sale_price: 2.99, cost_price: 1.40, stock_quantity: 30, in_stock: true, custom_size: "2.625 oz", updated_at: daysAgo(1) },
  { id: "inv-022", name: "Doritos Nacho Cheese", brand: "Doritos", category: "Snacks", sku: "SKU-022", sale_price: 2.99, cost_price: 1.40, stock_quantity: 28, in_stock: true, custom_size: "2.75 oz", updated_at: daysAgo(1) },
  { id: "inv-023", name: "Cheetos Crunchy", brand: "Cheetos", category: "Snacks", sku: "SKU-023", sale_price: 2.99, cost_price: 1.35, stock_quantity: 22, in_stock: true, custom_size: "3.25 oz", updated_at: daysAgo(2) },
  { id: "inv-024", name: "Takis Fuego", brand: "Takis", category: "Snacks", sku: "SKU-024", sale_price: 3.29, cost_price: 1.55, stock_quantity: 40, in_stock: true, custom_size: "4 oz", updated_at: hoursAgo(4) },
  { id: "inv-025", name: "Snickers Bar", brand: "Mars", category: "Snacks", sku: "SKU-025", sale_price: 2.29, cost_price: 1.00, stock_quantity: 48, in_stock: true, custom_size: "1.86 oz", updated_at: daysAgo(2) },
  { id: "inv-026", name: "M&M's Peanut", brand: "Mars", category: "Snacks", sku: "SKU-026", sale_price: 2.29, cost_price: 1.00, stock_quantity: 36, in_stock: true, custom_size: "1.74 oz", updated_at: daysAgo(3) },
  { id: "inv-027", name: "Haribo Gummy Bears", brand: "Haribo", category: "Snacks", sku: "SKU-027", sale_price: 2.49, cost_price: 1.10, stock_quantity: 24, in_stock: true, custom_size: "5 oz", updated_at: daysAgo(4) },
  { id: "inv-028", name: "Pringles Original", brand: "Pringles", category: "Snacks", sku: "SKU-028", sale_price: 2.79, cost_price: 1.30, stock_quantity: 15, in_stock: true, custom_size: "5.5 oz", updated_at: daysAgo(1) },
  { id: "inv-029", name: "Twix Caramel Cookie Bar", brand: "Mars", category: "Snacks", sku: "SKU-029", sale_price: 2.29, cost_price: 1.00, stock_quantity: 30, in_stock: true, custom_size: "1.79 oz", updated_at: daysAgo(2) },
  { id: "inv-030", name: "Hot Cheetos Limon", brand: "Cheetos", category: "Snacks", sku: "SKU-030", sale_price: 2.99, cost_price: 1.40, stock_quantity: 18, in_stock: true, custom_size: "3.25 oz", updated_at: daysAgo(1) },
  { id: "inv-031", name: "Plantain Chips", brand: "Goya", category: "Snacks", sku: "SKU-031", sale_price: 2.49, cost_price: 1.05, stock_quantity: 20, in_stock: true, custom_size: "5 oz", updated_at: daysAgo(3) },
  { id: "inv-032", name: "Honey Bun", brand: "Little Debbie", category: "Snacks", sku: "SKU-032", sale_price: 1.49, cost_price: 0.55, stock_quantity: 36, in_stock: true, custom_size: "4 oz", updated_at: daysAgo(2) },
  { id: "inv-033", name: "Sunflower Seeds Original", brand: "David", category: "Snacks", sku: "SKU-033", sale_price: 2.49, cost_price: 1.15, stock_quantity: 18, in_stock: true, custom_size: "5.25 oz", updated_at: daysAgo(4) },
  { id: "inv-034", name: "Beef Jerky Original", brand: "Jack Link's", category: "Snacks", sku: "SKU-034", sale_price: 5.99, cost_price: 3.50, stock_quantity: 10, in_stock: true, custom_size: "2.85 oz", updated_at: daysAgo(3) },
  { id: "inv-035", name: "Utz Cheese Balls", brand: "Utz", category: "Snacks", sku: "SKU-035", sale_price: 3.99, cost_price: 2.00, stock_quantity: 8, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(5) },
  { id: "inv-036", name: "Swedish Fish", brand: "Swedish Fish", category: "Snacks", sku: "SKU-036", sale_price: 2.49, cost_price: 1.05, stock_quantity: 24, in_stock: true, custom_size: "5 oz", updated_at: daysAgo(2) },
  { id: "inv-037", name: "Pop-Tarts Strawberry 2-Pack", brand: "Kellogg's", category: "Snacks", sku: "SKU-037", sale_price: 1.99, cost_price: 0.85, stock_quantity: 20, in_stock: true, custom_size: "3.3 oz", updated_at: daysAgo(3) },
  { id: "inv-038", name: "Nature Valley Granola Bar", brand: "Nature Valley", category: "Snacks", sku: "SKU-038", sale_price: 1.79, cost_price: 0.75, stock_quantity: 1, in_stock: true, custom_size: "1.49 oz", updated_at: daysAgo(6) },
  { id: "inv-039", name: "Ruffles Cheddar & Sour Cream", brand: "Ruffles", category: "Snacks", sku: "SKU-039", sale_price: 2.99, cost_price: 1.40, stock_quantity: 14, in_stock: true, custom_size: "2.5 oz", updated_at: daysAgo(2) },
  { id: "inv-040", name: "SkinnyPop Popcorn", brand: "SkinnyPop", category: "Snacks", sku: "SKU-040", sale_price: 2.49, cost_price: 1.10, stock_quantity: 0, in_stock: false, custom_size: "4.4 oz", updated_at: daysAgo(7) },
  { id: "inv-041", name: "Kit Kat Bar", brand: "Hershey's", category: "Snacks", sku: "SKU-041", sale_price: 2.29, cost_price: 1.00, stock_quantity: 32, in_stock: true, custom_size: "1.5 oz", updated_at: daysAgo(1) },
  { id: "inv-042", name: "Wise Onion Rings", brand: "Wise", category: "Snacks", sku: "SKU-042", sale_price: 1.99, cost_price: 0.80, stock_quantity: 16, in_stock: true, custom_size: "4.75 oz", updated_at: daysAgo(3) },

  // ─── Dairy (15 items) ───────────────────────────────────────────────
  { id: "inv-043", name: "Whole Milk 1 Gallon", brand: "Farmland", category: "Dairy", sku: "SKU-043", sale_price: 5.99, cost_price: 3.40, stock_quantity: 8, in_stock: true, custom_size: "1 gal", updated_at: hoursAgo(6) },
  { id: "inv-044", name: "2% Reduced Fat Milk Half Gallon", brand: "Farmland", category: "Dairy", sku: "SKU-044", sale_price: 3.99, cost_price: 2.20, stock_quantity: 6, in_stock: true, custom_size: "0.5 gal", updated_at: hoursAgo(6) },
  { id: "inv-045", name: "Large Eggs Dozen", brand: "Eggland's Best", category: "Dairy", sku: "SKU-045", sale_price: 4.99, cost_price: 3.00, stock_quantity: 12, in_stock: true, custom_size: "12 ct", updated_at: daysAgo(1) },
  { id: "inv-046", name: "Butter Unsalted", brand: "Land O'Lakes", category: "Dairy", sku: "SKU-046", sale_price: 5.49, cost_price: 3.30, stock_quantity: 10, in_stock: true, custom_size: "1 lb", updated_at: daysAgo(2) },
  { id: "inv-047", name: "Cream Cheese Original", brand: "Philadelphia", category: "Dairy", sku: "SKU-047", sale_price: 3.99, cost_price: 2.10, stock_quantity: 8, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(1) },
  { id: "inv-048", name: "Shredded Mozzarella", brand: "Kraft", category: "Dairy", sku: "SKU-048", sale_price: 4.49, cost_price: 2.50, stock_quantity: 7, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(2) },
  { id: "inv-049", name: "American Cheese Singles", brand: "Kraft", category: "Dairy", sku: "SKU-049", sale_price: 4.99, cost_price: 2.80, stock_quantity: 10, in_stock: true, custom_size: "16 ct", updated_at: daysAgo(3) },
  { id: "inv-050", name: "Greek Yogurt Strawberry", brand: "Chobani", category: "Dairy", sku: "SKU-050", sale_price: 1.99, cost_price: 1.00, stock_quantity: 15, in_stock: true, custom_size: "5.3 oz", updated_at: daysAgo(1) },
  { id: "inv-051", name: "Sour Cream", brand: "Daisy", category: "Dairy", sku: "SKU-051", sale_price: 3.49, cost_price: 1.80, stock_quantity: 5, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(3) },
  { id: "inv-052", name: "Heavy Whipping Cream", brand: "Farmland", category: "Dairy", sku: "SKU-052", sale_price: 4.99, cost_price: 2.80, stock_quantity: 3, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(2) },
  { id: "inv-053", name: "Chocolate Milk Quart", brand: "Nesquik", category: "Dairy", sku: "SKU-053", sale_price: 3.49, cost_price: 1.80, stock_quantity: 8, in_stock: true, custom_size: "1 qt", updated_at: daysAgo(1) },
  { id: "inv-054", name: "Oat Milk Original", brand: "Oatly", category: "Dairy", sku: "SKU-054", sale_price: 5.49, cost_price: 3.10, stock_quantity: 4, in_stock: true, custom_size: "32 oz", updated_at: daysAgo(4) },
  { id: "inv-055", name: "Half & Half", brand: "Farmland", category: "Dairy", sku: "SKU-055", sale_price: 3.29, cost_price: 1.70, stock_quantity: 6, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(2) },
  { id: "inv-056", name: "Yogurt Drink Mango", brand: "Dannon", category: "Dairy", sku: "SKU-056", sale_price: 2.49, cost_price: 1.20, stock_quantity: 0, in_stock: false, custom_size: "7 oz", updated_at: daysAgo(8) },
  { id: "inv-057", name: "Crema Mexicana", brand: "Cacique", category: "Dairy", sku: "SKU-057", sale_price: 3.99, cost_price: 2.10, stock_quantity: 5, in_stock: true, custom_size: "15 oz", updated_at: daysAgo(3) },

  // ─── Produce (12 items) ─────────────────────────────────────────────
  { id: "inv-058", name: "Bananas (per lb)", brand: "Del Monte", category: "Produce", sku: "SKU-058", sale_price: 0.79, cost_price: 0.30, stock_quantity: 40, in_stock: true, custom_size: "per lb", updated_at: hoursAgo(2) },
  { id: "inv-059", name: "Avocados (each)", brand: "Hass", category: "Produce", sku: "SKU-059", sale_price: 1.99, cost_price: 0.90, stock_quantity: 18, in_stock: true, custom_size: "each", updated_at: hoursAgo(4) },
  { id: "inv-060", name: "Limes (each)", brand: "Fresh", category: "Produce", sku: "SKU-060", sale_price: 0.50, cost_price: 0.15, stock_quantity: 50, in_stock: true, custom_size: "each", updated_at: hoursAgo(3) },
  { id: "inv-061", name: "Lemons (each)", brand: "Fresh", category: "Produce", sku: "SKU-061", sale_price: 0.69, cost_price: 0.20, stock_quantity: 30, in_stock: true, custom_size: "each", updated_at: hoursAgo(3) },
  { id: "inv-062", name: "Yellow Onions 3lb Bag", brand: "Fresh", category: "Produce", sku: "SKU-062", sale_price: 2.99, cost_price: 1.20, stock_quantity: 10, in_stock: true, custom_size: "3 lb", updated_at: daysAgo(1) },
  { id: "inv-063", name: "Tomatoes Roma (per lb)", brand: "Fresh", category: "Produce", sku: "SKU-063", sale_price: 1.99, cost_price: 0.80, stock_quantity: 15, in_stock: true, custom_size: "per lb", updated_at: hoursAgo(5) },
  { id: "inv-064", name: "Cilantro Bunch", brand: "Fresh", category: "Produce", sku: "SKU-064", sale_price: 0.99, cost_price: 0.30, stock_quantity: 12, in_stock: true, custom_size: "1 bunch", updated_at: hoursAgo(6) },
  { id: "inv-065", name: "Jalapeno Peppers (per lb)", brand: "Fresh", category: "Produce", sku: "SKU-065", sale_price: 1.49, cost_price: 0.55, stock_quantity: 8, in_stock: true, custom_size: "per lb", updated_at: daysAgo(1) },
  { id: "inv-066", name: "Green Plantains (each)", brand: "Fresh", category: "Produce", sku: "SKU-066", sale_price: 0.89, cost_price: 0.30, stock_quantity: 20, in_stock: true, custom_size: "each", updated_at: hoursAgo(4) },
  { id: "inv-067", name: "Sweet Potatoes (per lb)", brand: "Fresh", category: "Produce", sku: "SKU-067", sale_price: 1.79, cost_price: 0.70, stock_quantity: 12, in_stock: true, custom_size: "per lb", updated_at: daysAgo(2) },
  { id: "inv-068", name: "Garlic Head", brand: "Fresh", category: "Produce", sku: "SKU-068", sale_price: 0.99, cost_price: 0.30, stock_quantity: 25, in_stock: true, custom_size: "each", updated_at: daysAgo(1) },
  { id: "inv-069", name: "Apples Gala (per lb)", brand: "Fresh", category: "Produce", sku: "SKU-069", sale_price: 1.99, cost_price: 0.85, stock_quantity: 1, in_stock: true, custom_size: "per lb", updated_at: daysAgo(4) },

  // ─── Canned Goods (15 items) ────────────────────────────────────────
  { id: "inv-070", name: "Black Beans 15.5oz", brand: "Goya", category: "Canned Goods", sku: "SKU-070", sale_price: 1.49, cost_price: 0.65, stock_quantity: 36, in_stock: true, custom_size: "15.5 oz", updated_at: daysAgo(3) },
  { id: "inv-071", name: "Pinto Beans 15.5oz", brand: "Goya", category: "Canned Goods", sku: "SKU-071", sale_price: 1.49, cost_price: 0.65, stock_quantity: 30, in_stock: true, custom_size: "15.5 oz", updated_at: daysAgo(3) },
  { id: "inv-072", name: "Chickpeas 15.5oz", brand: "Goya", category: "Canned Goods", sku: "SKU-072", sale_price: 1.49, cost_price: 0.65, stock_quantity: 24, in_stock: true, custom_size: "15.5 oz", updated_at: daysAgo(4) },
  { id: "inv-073", name: "Tomato Sauce 8oz", brand: "Goya", category: "Canned Goods", sku: "SKU-073", sale_price: 0.99, cost_price: 0.40, stock_quantity: 48, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(2) },
  { id: "inv-074", name: "Chicken Noodle Soup", brand: "Campbell's", category: "Canned Goods", sku: "SKU-074", sale_price: 1.99, cost_price: 0.90, stock_quantity: 20, in_stock: true, custom_size: "10.75 oz", updated_at: daysAgo(5) },
  { id: "inv-075", name: "Tuna Chunk Light in Water", brand: "StarKist", category: "Canned Goods", sku: "SKU-075", sale_price: 1.79, cost_price: 0.85, stock_quantity: 24, in_stock: true, custom_size: "5 oz", updated_at: daysAgo(3) },
  { id: "inv-076", name: "Corned Beef 12oz", brand: "Libby's", category: "Canned Goods", sku: "SKU-076", sale_price: 5.49, cost_price: 3.20, stock_quantity: 8, in_stock: true, custom_size: "12 oz", updated_at: daysAgo(6) },
  { id: "inv-077", name: "Spam Classic 12oz", brand: "Spam", category: "Canned Goods", sku: "SKU-077", sale_price: 4.49, cost_price: 2.50, stock_quantity: 10, in_stock: true, custom_size: "12 oz", updated_at: daysAgo(5) },
  { id: "inv-078", name: "Corn Whole Kernel", brand: "Green Giant", category: "Canned Goods", sku: "SKU-078", sale_price: 1.49, cost_price: 0.60, stock_quantity: 18, in_stock: true, custom_size: "15.25 oz", updated_at: daysAgo(4) },
  { id: "inv-079", name: "Coconut Milk 13.5oz", brand: "Goya", category: "Canned Goods", sku: "SKU-079", sale_price: 2.49, cost_price: 1.10, stock_quantity: 12, in_stock: true, custom_size: "13.5 oz", updated_at: daysAgo(3) },
  { id: "inv-080", name: "Sardines in Tomato Sauce", brand: "Season", category: "Canned Goods", sku: "SKU-080", sale_price: 2.99, cost_price: 1.50, stock_quantity: 15, in_stock: true, custom_size: "4.375 oz", updated_at: daysAgo(5) },
  { id: "inv-081", name: "Diced Tomatoes 14.5oz", brand: "Hunt's", category: "Canned Goods", sku: "SKU-081", sale_price: 1.49, cost_price: 0.65, stock_quantity: 22, in_stock: true, custom_size: "14.5 oz", updated_at: daysAgo(4) },
  { id: "inv-082", name: "Red Kidney Beans 15.5oz", brand: "Goya", category: "Canned Goods", sku: "SKU-082", sale_price: 1.49, cost_price: 0.65, stock_quantity: 20, in_stock: true, custom_size: "15.5 oz", updated_at: daysAgo(3) },
  { id: "inv-083", name: "Vienna Sausages 4.6oz", brand: "Armour", category: "Canned Goods", sku: "SKU-083", sale_price: 1.29, cost_price: 0.55, stock_quantity: 16, in_stock: true, custom_size: "4.6 oz", updated_at: daysAgo(5) },
  { id: "inv-084", name: "Evaporated Milk 12oz", brand: "Carnation", category: "Canned Goods", sku: "SKU-084", sale_price: 1.99, cost_price: 0.90, stock_quantity: 12, in_stock: true, custom_size: "12 oz", updated_at: daysAgo(4) },

  // ─── Household (13 items) ───────────────────────────────────────────
  { id: "inv-085", name: "Paper Towels 2-Roll", brand: "Bounty", category: "Household", sku: "SKU-085", sale_price: 6.99, cost_price: 4.00, stock_quantity: 12, in_stock: true, custom_size: "2 rolls", updated_at: daysAgo(2) },
  { id: "inv-086", name: "Toilet Paper 4-Pack", brand: "Charmin", category: "Household", sku: "SKU-086", sale_price: 5.99, cost_price: 3.40, stock_quantity: 10, in_stock: true, custom_size: "4 rolls", updated_at: daysAgo(2) },
  { id: "inv-087", name: "Dish Soap Lemon 19oz", brand: "Dawn", category: "Household", sku: "SKU-087", sale_price: 3.99, cost_price: 2.10, stock_quantity: 8, in_stock: true, custom_size: "19 oz", updated_at: daysAgo(4) },
  { id: "inv-088", name: "Trash Bags 13 Gallon 15ct", brand: "Glad", category: "Household", sku: "SKU-088", sale_price: 5.49, cost_price: 3.00, stock_quantity: 14, in_stock: true, custom_size: "15 ct", updated_at: daysAgo(3) },
  { id: "inv-089", name: "Aluminum Foil 25ft", brand: "Reynolds", category: "Household", sku: "SKU-089", sale_price: 4.49, cost_price: 2.40, stock_quantity: 6, in_stock: true, custom_size: "25 ft", updated_at: daysAgo(5) },
  { id: "inv-090", name: "Laundry Detergent Pods 16ct", brand: "Tide", category: "Household", sku: "SKU-090", sale_price: 7.99, cost_price: 4.80, stock_quantity: 5, in_stock: true, custom_size: "16 ct", updated_at: daysAgo(3) },
  { id: "inv-091", name: "Bleach 32oz", brand: "Clorox", category: "Household", sku: "SKU-091", sale_price: 3.49, cost_price: 1.80, stock_quantity: 8, in_stock: true, custom_size: "32 oz", updated_at: daysAgo(6) },
  { id: "inv-092", name: "All-Purpose Cleaner 32oz", brand: "Fabuloso", category: "Household", sku: "SKU-092", sale_price: 3.99, cost_price: 2.00, stock_quantity: 10, in_stock: true, custom_size: "32 oz", updated_at: daysAgo(4) },
  { id: "inv-093", name: "Sponges 3-Pack", brand: "Scotch-Brite", category: "Household", sku: "SKU-093", sale_price: 2.99, cost_price: 1.40, stock_quantity: 7, in_stock: true, custom_size: "3 ct", updated_at: daysAgo(5) },
  { id: "inv-094", name: "Paper Plates 50ct", brand: "Dixie", category: "Household", sku: "SKU-094", sale_price: 4.99, cost_price: 2.80, stock_quantity: 6, in_stock: true, custom_size: "50 ct", updated_at: daysAgo(3) },
  { id: "inv-095", name: "Plastic Cups 16oz 20ct", brand: "Solo", category: "Household", sku: "SKU-095", sale_price: 3.99, cost_price: 2.00, stock_quantity: 8, in_stock: true, custom_size: "20 ct", updated_at: daysAgo(4) },
  { id: "inv-096", name: "Napkins 250ct", brand: "Vanity Fair", category: "Household", sku: "SKU-096", sale_price: 3.49, cost_price: 1.80, stock_quantity: 2, in_stock: true, custom_size: "250 ct", updated_at: daysAgo(6) },
  { id: "inv-097", name: "Zip-Lock Bags Quart 25ct", brand: "Ziploc", category: "Household", sku: "SKU-097", sale_price: 3.99, cost_price: 2.10, stock_quantity: 9, in_stock: true, custom_size: "25 ct", updated_at: daysAgo(5) },

  // ─── Health (12 items) ──────────────────────────────────────────────
  { id: "inv-098", name: "Advil Ibuprofen 24ct", brand: "Advil", category: "Health", sku: "SKU-098", sale_price: 7.99, cost_price: 4.50, stock_quantity: 10, in_stock: true, custom_size: "24 ct", updated_at: daysAgo(3) },
  { id: "inv-099", name: "Tylenol Extra Strength 24ct", brand: "Tylenol", category: "Health", sku: "SKU-099", sale_price: 8.49, cost_price: 4.80, stock_quantity: 8, in_stock: true, custom_size: "24 ct", updated_at: daysAgo(3) },
  { id: "inv-100", name: "Band-Aid Assorted 30ct", brand: "Band-Aid", category: "Health", sku: "SKU-100", sale_price: 4.99, cost_price: 2.60, stock_quantity: 12, in_stock: true, custom_size: "30 ct", updated_at: daysAgo(5) },
  { id: "inv-101", name: "Pepto-Bismol Liquid 8oz", brand: "Pepto-Bismol", category: "Health", sku: "SKU-101", sale_price: 7.49, cost_price: 4.10, stock_quantity: 5, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(6) },
  { id: "inv-102", name: "Tums Antacid 72ct", brand: "Tums", category: "Health", sku: "SKU-102", sale_price: 5.99, cost_price: 3.20, stock_quantity: 7, in_stock: true, custom_size: "72 ct", updated_at: daysAgo(4) },
  { id: "inv-103", name: "Colgate Toothpaste 6oz", brand: "Colgate", category: "Health", sku: "SKU-103", sale_price: 3.99, cost_price: 2.00, stock_quantity: 15, in_stock: true, custom_size: "6 oz", updated_at: daysAgo(3) },
  { id: "inv-104", name: "Deodorant Sport Fresh", brand: "Degree", category: "Health", sku: "SKU-104", sale_price: 5.49, cost_price: 3.00, stock_quantity: 8, in_stock: true, custom_size: "2.7 oz", updated_at: daysAgo(5) },
  { id: "inv-105", name: "Hand Sanitizer 8oz", brand: "Purell", category: "Health", sku: "SKU-105", sale_price: 4.49, cost_price: 2.40, stock_quantity: 10, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(4) },
  { id: "inv-106", name: "Tissue Box 85ct", brand: "Kleenex", category: "Health", sku: "SKU-106", sale_price: 2.99, cost_price: 1.40, stock_quantity: 9, in_stock: true, custom_size: "85 ct", updated_at: daysAgo(3) },
  { id: "inv-107", name: "Cough Drops Cherry 30ct", brand: "Halls", category: "Health", sku: "SKU-107", sale_price: 3.49, cost_price: 1.70, stock_quantity: 11, in_stock: true, custom_size: "30 ct", updated_at: daysAgo(5) },
  { id: "inv-108", name: "Neosporin Ointment 0.5oz", brand: "Neosporin", category: "Health", sku: "SKU-108", sale_price: 6.99, cost_price: 3.80, stock_quantity: 4, in_stock: true, custom_size: "0.5 oz", updated_at: daysAgo(7) },
  { id: "inv-109", name: "Vaseline Petroleum Jelly 3.75oz", brand: "Vaseline", category: "Health", sku: "SKU-109", sale_price: 3.99, cost_price: 2.00, stock_quantity: 6, in_stock: true, custom_size: "3.75 oz", updated_at: daysAgo(4) },

  // ─── Frozen (13 items) ──────────────────────────────────────────────
  { id: "inv-110", name: "Frozen Pizza Pepperoni", brand: "DiGiorno", category: "Frozen", sku: "SKU-110", sale_price: 7.99, cost_price: 4.40, stock_quantity: 6, in_stock: true, custom_size: "27.5 oz", updated_at: daysAgo(2) },
  { id: "inv-111", name: "Ice Cream Vanilla 1 Pint", brand: "Haagen-Dazs", category: "Frozen", sku: "SKU-111", sale_price: 5.99, cost_price: 3.40, stock_quantity: 8, in_stock: true, custom_size: "1 pt", updated_at: daysAgo(1) },
  { id: "inv-112", name: "Frozen Chicken Tenders 25oz", brand: "Tyson", category: "Frozen", sku: "SKU-112", sale_price: 8.99, cost_price: 5.20, stock_quantity: 5, in_stock: true, custom_size: "25 oz", updated_at: daysAgo(3) },
  { id: "inv-113", name: "Hot Pockets Pepperoni 2-Pack", brand: "Hot Pockets", category: "Frozen", sku: "SKU-113", sale_price: 3.99, cost_price: 2.00, stock_quantity: 10, in_stock: true, custom_size: "9 oz", updated_at: daysAgo(2) },
  { id: "inv-114", name: "Frozen French Fries 28oz", brand: "Ore-Ida", category: "Frozen", sku: "SKU-114", sale_price: 4.99, cost_price: 2.70, stock_quantity: 7, in_stock: true, custom_size: "28 oz", updated_at: daysAgo(4) },
  { id: "inv-115", name: "Ice Cream Sandwich 6-Pack", brand: "Good Humor", category: "Frozen", sku: "SKU-115", sale_price: 5.49, cost_price: 3.00, stock_quantity: 4, in_stock: true, custom_size: "6 ct", updated_at: daysAgo(2) },
  { id: "inv-116", name: "Frozen Empanadas Beef 10ct", brand: "Goya", category: "Frozen", sku: "SKU-116", sale_price: 6.49, cost_price: 3.60, stock_quantity: 6, in_stock: true, custom_size: "10 ct", updated_at: daysAgo(3) },
  { id: "inv-117", name: "Frozen Vegetables Mixed 16oz", brand: "Birds Eye", category: "Frozen", sku: "SKU-117", sale_price: 2.99, cost_price: 1.40, stock_quantity: 8, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(4) },
  { id: "inv-118", name: "Frozen Waffles 10ct", brand: "Eggo", category: "Frozen", sku: "SKU-118", sale_price: 3.99, cost_price: 2.00, stock_quantity: 5, in_stock: true, custom_size: "10 ct", updated_at: daysAgo(2) },
  { id: "inv-119", name: "Popsicles Variety 12ct", brand: "Popsicle", category: "Frozen", sku: "SKU-119", sale_price: 4.99, cost_price: 2.60, stock_quantity: 3, in_stock: true, custom_size: "12 ct", updated_at: daysAgo(5) },
  { id: "inv-120", name: "Frozen Burritos Bean & Cheese 8ct", brand: "El Monterey", category: "Frozen", sku: "SKU-120", sale_price: 5.49, cost_price: 3.00, stock_quantity: 7, in_stock: true, custom_size: "8 ct", updated_at: daysAgo(3) },
  { id: "inv-121", name: "Frozen Fish Sticks 24ct", brand: "Gorton's", category: "Frozen", sku: "SKU-121", sale_price: 6.99, cost_price: 3.80, stock_quantity: 0, in_stock: false, custom_size: "24 ct", updated_at: daysAgo(9) },
  { id: "inv-122", name: "Frozen Corn on the Cob 4ct", brand: "Green Giant", category: "Frozen", sku: "SKU-122", sale_price: 3.49, cost_price: 1.80, stock_quantity: 5, in_stock: true, custom_size: "4 ct", updated_at: daysAgo(4) },

  // ─── Deli (10 items) ────────────────────────────────────────────────
  { id: "inv-123", name: "Turkey Breast Deli Sliced", brand: "Oscar Mayer", category: "Deli", sku: "SKU-123", sale_price: 5.99, cost_price: 3.40, stock_quantity: 8, in_stock: true, custom_size: "8 oz", updated_at: hoursAgo(8) },
  { id: "inv-124", name: "Ham Deli Sliced", brand: "Oscar Mayer", category: "Deli", sku: "SKU-124", sale_price: 5.49, cost_price: 3.10, stock_quantity: 6, in_stock: true, custom_size: "8 oz", updated_at: hoursAgo(8) },
  { id: "inv-125", name: "Salami Genoa Sliced", brand: "Hormel", category: "Deli", sku: "SKU-125", sale_price: 6.49, cost_price: 3.70, stock_quantity: 5, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(1) },
  { id: "inv-126", name: "Bologna Beef", brand: "Oscar Mayer", category: "Deli", sku: "SKU-126", sale_price: 3.99, cost_price: 2.00, stock_quantity: 7, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(2) },
  { id: "inv-127", name: "Hot Dogs 8-Pack", brand: "Nathan's", category: "Deli", sku: "SKU-127", sale_price: 5.99, cost_price: 3.30, stock_quantity: 10, in_stock: true, custom_size: "8 ct", updated_at: daysAgo(1) },
  { id: "inv-128", name: "Bacon Hardwood Smoked", brand: "Oscar Mayer", category: "Deli", sku: "SKU-128", sale_price: 7.49, cost_price: 4.20, stock_quantity: 6, in_stock: true, custom_size: "16 oz", updated_at: daysAgo(2) },
  { id: "inv-129", name: "Chorizo Mexican Style", brand: "Cacique", category: "Deli", sku: "SKU-129", sale_price: 3.99, cost_price: 2.00, stock_quantity: 8, in_stock: true, custom_size: "9 oz", updated_at: daysAgo(2) },
  { id: "inv-130", name: "Pepperoni Sliced 6oz", brand: "Hormel", category: "Deli", sku: "SKU-130", sale_price: 3.49, cost_price: 1.80, stock_quantity: 10, in_stock: true, custom_size: "6 oz", updated_at: daysAgo(3) },
  { id: "inv-131", name: "Ground Beef 80/20 1lb", brand: "Fresh", category: "Deli", sku: "SKU-131", sale_price: 6.99, cost_price: 4.20, stock_quantity: 4, in_stock: true, custom_size: "1 lb", updated_at: hoursAgo(10) },
  { id: "inv-132", name: "Chicken Breast Boneless 1lb", brand: "Fresh", category: "Deli", sku: "SKU-132", sale_price: 5.99, cost_price: 3.40, stock_quantity: 3, in_stock: true, custom_size: "1 lb", updated_at: hoursAgo(10) },

  // ─── Bakery (10 items) ──────────────────────────────────────────────
  { id: "inv-133", name: "White Bread Loaf", brand: "Wonder", category: "Bakery", sku: "SKU-133", sale_price: 3.99, cost_price: 2.00, stock_quantity: 12, in_stock: true, custom_size: "20 oz", updated_at: hoursAgo(4) },
  { id: "inv-134", name: "Wheat Bread Loaf", brand: "Arnold", category: "Bakery", sku: "SKU-134", sale_price: 4.49, cost_price: 2.40, stock_quantity: 8, in_stock: true, custom_size: "24 oz", updated_at: hoursAgo(4) },
  { id: "inv-135", name: "Flour Tortillas 8ct", brand: "Mission", category: "Bakery", sku: "SKU-135", sale_price: 3.49, cost_price: 1.70, stock_quantity: 14, in_stock: true, custom_size: "8 ct", updated_at: daysAgo(1) },
  { id: "inv-136", name: "Corn Tortillas 30ct", brand: "Mission", category: "Bakery", sku: "SKU-136", sale_price: 2.99, cost_price: 1.30, stock_quantity: 10, in_stock: true, custom_size: "30 ct", updated_at: daysAgo(1) },
  { id: "inv-137", name: "Hamburger Buns 8-Pack", brand: "Martin's", category: "Bakery", sku: "SKU-137", sale_price: 4.49, cost_price: 2.40, stock_quantity: 6, in_stock: true, custom_size: "8 ct", updated_at: daysAgo(2) },
  { id: "inv-138", name: "Bagels Plain 6-Pack", brand: "Thomas'", category: "Bakery", sku: "SKU-138", sale_price: 4.99, cost_price: 2.70, stock_quantity: 5, in_stock: true, custom_size: "6 ct", updated_at: daysAgo(1) },
  { id: "inv-139", name: "Donuts Powdered 6-Pack", brand: "Entenmann's", category: "Bakery", sku: "SKU-139", sale_price: 5.49, cost_price: 3.00, stock_quantity: 4, in_stock: true, custom_size: "6 ct", updated_at: hoursAgo(6) },
  { id: "inv-140", name: "Pan Sobao (Puerto Rican Bread)", brand: "El Jibarito", category: "Bakery", sku: "SKU-140", sale_price: 3.99, cost_price: 2.00, stock_quantity: 6, in_stock: true, custom_size: "14 oz", updated_at: hoursAgo(5) },
  { id: "inv-141", name: "English Muffins 6-Pack", brand: "Thomas'", category: "Bakery", sku: "SKU-141", sale_price: 4.49, cost_price: 2.40, stock_quantity: 3, in_stock: true, custom_size: "6 ct", updated_at: daysAgo(2) },
  { id: "inv-142", name: "Croissants 4-Pack", brand: "Bakery Fresh", category: "Bakery", sku: "SKU-142", sale_price: 4.99, cost_price: 2.70, stock_quantity: 2, in_stock: true, custom_size: "4 ct", updated_at: hoursAgo(8) },

  // ─── Tobacco & Lottery (8 items - labels only, no actual tobacco) ───
  { id: "inv-143", name: "Lottery Scratch-Off Display", brand: "NY Lottery", category: "Tobacco & Lottery", sku: "SKU-143", sale_price: 0.00, cost_price: 0.00, stock_quantity: 200, in_stock: true, custom_size: "assorted", updated_at: daysAgo(1) },
  { id: "inv-144", name: "Lighter Classic", brand: "Bic", category: "Tobacco & Lottery", sku: "SKU-144", sale_price: 1.99, cost_price: 0.60, stock_quantity: 48, in_stock: true, custom_size: "each", updated_at: daysAgo(3) },
  { id: "inv-145", name: "Lighter Refillable", brand: "Bic", category: "Tobacco & Lottery", sku: "SKU-145", sale_price: 3.99, cost_price: 1.50, stock_quantity: 12, in_stock: true, custom_size: "each", updated_at: daysAgo(5) },
  { id: "inv-146", name: "Rolling Papers", brand: "RAW", category: "Tobacco & Lottery", sku: "SKU-146", sale_price: 2.99, cost_price: 1.20, stock_quantity: 20, in_stock: true, custom_size: "32 ct", updated_at: daysAgo(4) },
  { id: "inv-147", name: "Cigar Wraps Grape 2-Pack", brand: "Swisher", category: "Tobacco & Lottery", sku: "SKU-147", sale_price: 1.49, cost_price: 0.55, stock_quantity: 30, in_stock: true, custom_size: "2 ct", updated_at: daysAgo(2) },
  { id: "inv-148", name: "Matches 3-Pack", brand: "Diamond", category: "Tobacco & Lottery", sku: "SKU-148", sale_price: 0.99, cost_price: 0.25, stock_quantity: 40, in_stock: true, custom_size: "3 boxes", updated_at: daysAgo(6) },
  { id: "inv-149", name: "Air Freshener Vanilla", brand: "Little Trees", category: "Tobacco & Lottery", sku: "SKU-149", sale_price: 1.49, cost_price: 0.40, stock_quantity: 24, in_stock: true, custom_size: "each", updated_at: daysAgo(4) },
  { id: "inv-150", name: "Phone Charger Cable USB-C", brand: "Generic", category: "Tobacco & Lottery", sku: "SKU-150", sale_price: 5.99, cost_price: 1.50, stock_quantity: 8, in_stock: true, custom_size: "3 ft", updated_at: daysAgo(5) },

  // ─── International Foods (15 items) ─────────────────────────────────
  { id: "inv-151", name: "Sazon Seasoning 8-Pack", brand: "Goya", category: "International Foods", sku: "SKU-151", sale_price: 1.99, cost_price: 0.80, stock_quantity: 24, in_stock: true, custom_size: "8 ct", updated_at: daysAgo(2) },
  { id: "inv-152", name: "Adobo All-Purpose Seasoning", brand: "Goya", category: "International Foods", sku: "SKU-152", sale_price: 2.99, cost_price: 1.30, stock_quantity: 18, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(3) },
  { id: "inv-153", name: "Sofrito 12oz", brand: "Goya", category: "International Foods", sku: "SKU-153", sale_price: 2.49, cost_price: 1.10, stock_quantity: 10, in_stock: true, custom_size: "12 oz", updated_at: daysAgo(3) },
  { id: "inv-154", name: "Jasmine Rice 5lb", brand: "Dynasty", category: "International Foods", sku: "SKU-154", sale_price: 6.99, cost_price: 3.80, stock_quantity: 8, in_stock: true, custom_size: "5 lb", updated_at: daysAgo(4) },
  { id: "inv-155", name: "Yellow Rice Mix 8oz", brand: "Goya", category: "International Foods", sku: "SKU-155", sale_price: 1.49, cost_price: 0.60, stock_quantity: 20, in_stock: true, custom_size: "8 oz", updated_at: daysAgo(3) },
  { id: "inv-156", name: "Recaito Cooking Base 12oz", brand: "Goya", category: "International Foods", sku: "SKU-156", sale_price: 2.99, cost_price: 1.40, stock_quantity: 8, in_stock: true, custom_size: "12 oz", updated_at: daysAgo(4) },
  { id: "inv-157", name: "Mole Sauce 8.25oz", brand: "Dona Maria", category: "International Foods", sku: "SKU-157", sale_price: 3.49, cost_price: 1.70, stock_quantity: 6, in_stock: true, custom_size: "8.25 oz", updated_at: daysAgo(5) },
  { id: "inv-158", name: "Chipotle Peppers in Adobo 7oz", brand: "La Costena", category: "International Foods", sku: "SKU-158", sale_price: 1.99, cost_price: 0.80, stock_quantity: 14, in_stock: true, custom_size: "7 oz", updated_at: daysAgo(3) },
  { id: "inv-159", name: "Ramen Noodles Chicken 3oz", brand: "Maruchan", category: "International Foods", sku: "SKU-159", sale_price: 0.49, cost_price: 0.15, stock_quantity: 60, in_stock: true, custom_size: "3 oz", updated_at: daysAgo(2) },
  { id: "inv-160", name: "Soy Sauce 10oz", brand: "Kikkoman", category: "International Foods", sku: "SKU-160", sale_price: 3.49, cost_price: 1.70, stock_quantity: 10, in_stock: true, custom_size: "10 oz", updated_at: daysAgo(4) },
  { id: "inv-161", name: "Sriracha Hot Chili Sauce 17oz", brand: "Huy Fong", category: "International Foods", sku: "SKU-161", sale_price: 4.49, cost_price: 2.40, stock_quantity: 7, in_stock: true, custom_size: "17 oz", updated_at: daysAgo(3) },
  { id: "inv-162", name: "Maseca Corn Flour 4.4lb", brand: "Maseca", category: "International Foods", sku: "SKU-162", sale_price: 3.99, cost_price: 2.00, stock_quantity: 9, in_stock: true, custom_size: "4.4 lb", updated_at: daysAgo(5) },
  { id: "inv-163", name: "Valentina Hot Sauce 12.5oz", brand: "Valentina", category: "International Foods", sku: "SKU-163", sale_price: 1.99, cost_price: 0.70, stock_quantity: 15, in_stock: true, custom_size: "12.5 oz", updated_at: daysAgo(2) },
  { id: "inv-164", name: "Tamarind Paste 14oz", brand: "Tamicon", category: "International Foods", sku: "SKU-164", sale_price: 3.99, cost_price: 2.00, stock_quantity: 0, in_stock: false, custom_size: "14 oz", updated_at: daysAgo(10) },
  { id: "inv-165", name: "Dulce de Leche 15.8oz", brand: "La Serenisima", category: "International Foods", sku: "SKU-165", sale_price: 5.49, cost_price: 3.00, stock_quantity: 3, in_stock: true, custom_size: "15.8 oz", updated_at: daysAgo(4) },
];

/**
 * Filter inventory items by category name (case-insensitive).
 */
export function getInventoryByCategory(category: string): InventoryItem[] {
  return DEMO_INVENTORY.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Search inventory by name, brand, or SKU (case-insensitive).
 */
export function searchInventory(term: string): InventoryItem[] {
  const lower = term.toLowerCase();
  return DEMO_INVENTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.brand.toLowerCase().includes(lower) ||
      item.sku.toLowerCase().includes(lower)
  );
}
