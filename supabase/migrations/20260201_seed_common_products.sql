-- Seed Common Grocery Products
-- Populates the products table with ~100 common grocery items
-- This enables fuzzy matching to reduce API calls
--
-- Categories covered:
-- - Dairy (milk, eggs, cheese, butter, yogurt)
-- - Bread & Bakery
-- - Produce (fruits, vegetables)
-- - Meat & Protein
-- - Pantry Staples
-- - Beverages
-- - Snacks
-- - Frozen Foods
-- - Household Essentials

-- Helper function to safely insert products (skip if name exists)
DO $$
BEGIN
  -- DAIRY
  INSERT INTO products (name, brand, category, size) VALUES
    ('2% Reduced Fat Milk', 'Great Value', 'Dairy', '1 gallon')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Whole Milk', 'Great Value', 'Dairy', '1 gallon')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Skim Fat Free Milk', 'Great Value', 'Dairy', '1 gallon')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Large White Eggs', 'Great Value', 'Dairy', '12 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Large Brown Eggs', 'Organic Valley', 'Dairy', '12 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Shredded Cheddar Cheese', 'Kraft', 'Dairy', '8 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('American Cheese Singles', 'Kraft', 'Dairy', '16 slices')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Butter Salted', 'Land O Lakes', 'Dairy', '1 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Greek Yogurt Plain', 'Chobani', 'Dairy', '32 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Sour Cream', 'Daisy', 'Dairy', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Cream Cheese', 'Philadelphia', 'Dairy', '8 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Heavy Whipping Cream', 'Great Value', 'Dairy', '16 oz')
    ON CONFLICT DO NOTHING;

  -- BREAD & BAKERY
  INSERT INTO products (name, brand, category, size) VALUES
    ('White Bread', 'Wonder', 'Bakery', '20 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Whole Wheat Bread', 'Natures Own', 'Bakery', '20 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Hamburger Buns', 'Great Value', 'Bakery', '8 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Hot Dog Buns', 'Great Value', 'Bakery', '8 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Flour Tortillas', 'Mission', 'Bakery', '10 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('English Muffins', 'Thomas', 'Bakery', '6 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bagels Plain', 'Thomas', 'Bakery', '6 count')
    ON CONFLICT DO NOTHING;

  -- PRODUCE - FRUITS
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bananas', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Apples Gala', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Apples Fuji', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Oranges Navel', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Strawberries', NULL, 'Produce', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Blueberries', NULL, 'Produce', '6 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Grapes Red Seedless', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Lemons', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Limes', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Avocados', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;

  -- PRODUCE - VEGETABLES
  INSERT INTO products (name, brand, category, size) VALUES
    ('Russet Potatoes', NULL, 'Produce', '5 lb bag')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Yellow Onions', NULL, 'Produce', '3 lb bag')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Garlic', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Tomatoes Roma', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Lettuce Romaine', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Lettuce Iceberg', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Baby Spinach', NULL, 'Produce', '5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Carrots', NULL, 'Produce', '1 lb bag')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Celery', NULL, 'Produce', 'bunch')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Broccoli', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bell Peppers Green', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bell Peppers Red', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Cucumber', NULL, 'Produce', 'each')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Jalapeno Peppers', NULL, 'Produce', 'per lb')
    ON CONFLICT DO NOTHING;

  -- MEAT & PROTEIN
  INSERT INTO products (name, brand, category, size) VALUES
    ('Ground Beef 80/20', NULL, 'Meat', '1 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Ground Beef 93/7 Lean', NULL, 'Meat', '1 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Chicken Breast Boneless', NULL, 'Meat', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Chicken Thighs', NULL, 'Meat', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bacon', 'Oscar Mayer', 'Meat', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Hot Dogs', 'Oscar Mayer', 'Meat', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Deli Turkey', 'Oscar Mayer', 'Meat', '9 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Deli Ham', 'Oscar Mayer', 'Meat', '9 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Salmon Fillet', NULL, 'Seafood', 'per lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Shrimp Raw', NULL, 'Seafood', '1 lb bag')
    ON CONFLICT DO NOTHING;

  -- PANTRY STAPLES
  INSERT INTO products (name, brand, category, size) VALUES
    ('White Rice Long Grain', 'Great Value', 'Pantry', '5 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Pasta Spaghetti', 'Barilla', 'Pantry', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Pasta Penne', 'Barilla', 'Pantry', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Marinara Sauce', 'Ragu', 'Pantry', '24 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Tomato Sauce', 'Hunt''s', 'Pantry', '8 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Diced Tomatoes', 'Hunt''s', 'Pantry', '14.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Black Beans', 'Goya', 'Pantry', '15.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Pinto Beans', 'Goya', 'Pantry', '15.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Chicken Broth', 'Swanson', 'Pantry', '32 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Olive Oil Extra Virgin', 'Great Value', 'Pantry', '17 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Vegetable Oil', 'Crisco', 'Pantry', '48 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('All Purpose Flour', 'Gold Medal', 'Pantry', '5 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Granulated Sugar', 'Domino', 'Pantry', '4 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Brown Sugar', 'Domino', 'Pantry', '2 lb')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Salt', 'Morton', 'Pantry', '26 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Black Pepper Ground', 'McCormick', 'Pantry', '3 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Peanut Butter', 'Jif', 'Pantry', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Jelly Grape', 'Welchs', 'Pantry', '18 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Mayonnaise', 'Hellmanns', 'Pantry', '30 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Ketchup', 'Heinz', 'Pantry', '32 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Mustard Yellow', 'French''s', 'Pantry', '14 oz')
    ON CONFLICT DO NOTHING;

  -- BEVERAGES
  INSERT INTO products (name, brand, category, size) VALUES
    ('Orange Juice', 'Tropicana', 'Beverages', '52 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Apple Juice', 'Motts', 'Beverages', '64 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Bottled Water', 'Dasani', 'Beverages', '24 pack')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Coffee Ground', 'Folgers', 'Beverages', '30.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Coffee K-Cups', 'Green Mountain', 'Beverages', '12 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Coca Cola', 'Coca Cola', 'Beverages', '12 pack')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Pepsi', 'Pepsi', 'Beverages', '12 pack')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Sprite', 'Sprite', 'Beverages', '12 pack')
    ON CONFLICT DO NOTHING;

  -- BREAKFAST
  INSERT INTO products (name, brand, category, size) VALUES
    ('Cereal Cheerios', 'General Mills', 'Breakfast', '18 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Cereal Frosted Flakes', 'Kelloggs', 'Breakfast', '13.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Oatmeal Quick Oats', 'Quaker', 'Breakfast', '42 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Pancake Mix', 'Aunt Jemima', 'Breakfast', '32 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Maple Syrup', 'Mrs Butterworth', 'Breakfast', '24 oz')
    ON CONFLICT DO NOTHING;

  -- SNACKS
  INSERT INTO products (name, brand, category, size) VALUES
    ('Potato Chips', 'Lays', 'Snacks', '10 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Tortilla Chips', 'Tostitos', 'Snacks', '13 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Salsa Medium', 'Tostitos', 'Snacks', '15.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Crackers Saltine', 'Premium', 'Snacks', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Oreo Cookies', 'Nabisco', 'Snacks', '14.3 oz')
    ON CONFLICT DO NOTHING;

  -- FROZEN FOODS
  INSERT INTO products (name, brand, category, size) VALUES
    ('Frozen Vegetables Mixed', 'Birds Eye', 'Frozen', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Frozen Corn', 'Birds Eye', 'Frozen', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Frozen Peas', 'Birds Eye', 'Frozen', '16 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Ice Cream Vanilla', 'Breyers', 'Frozen', '48 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Frozen Pizza Pepperoni', 'DiGiorno', 'Frozen', '27.5 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Chicken Nuggets', 'Tyson', 'Frozen', '32 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('French Fries', 'Ore Ida', 'Frozen', '32 oz')
    ON CONFLICT DO NOTHING;

  -- HOUSEHOLD
  INSERT INTO products (name, brand, category, size) VALUES
    ('Paper Towels', 'Bounty', 'Household', '6 rolls')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Toilet Paper', 'Charmin', 'Household', '12 rolls')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Dish Soap', 'Dawn', 'Household', '24 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Laundry Detergent', 'Tide', 'Household', '100 oz')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Trash Bags', 'Glad', 'Household', '30 count')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Aluminum Foil', 'Reynolds', 'Household', '75 sq ft')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Plastic Wrap', 'Saran', 'Household', '200 sq ft')
    ON CONFLICT DO NOTHING;
  INSERT INTO products (name, brand, category, size) VALUES
    ('Zip Lock Bags Gallon', 'Ziploc', 'Household', '38 count')
    ON CONFLICT DO NOTHING;
END $$;

-- Log seeded products count
DO $$
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  RAISE NOTICE 'Products table now has % items', product_count;
END $$;
