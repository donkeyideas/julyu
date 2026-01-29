-- ============================================
-- Inventory Helper Functions
-- ============================================

-- Function to decrement inventory stock quantity
-- Used when orders are placed to reduce available stock
CREATE OR REPLACE FUNCTION decrement_inventory_stock(
  p_inventory_id UUID,
  p_quantity INT
)
RETURNS void AS $$
BEGIN
  UPDATE bodega_inventory
  SET
    stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
    in_stock = CASE
      WHEN stock_quantity - p_quantity <= 0 THEN FALSE
      ELSE in_stock
    END,
    updated_at = NOW()
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment inventory stock quantity
-- Used when orders are cancelled or inventory is restocked
CREATE OR REPLACE FUNCTION increment_inventory_stock(
  p_inventory_id UUID,
  p_quantity INT
)
RETURNS void AS $$
BEGIN
  UPDATE bodega_inventory
  SET
    stock_quantity = stock_quantity + p_quantity,
    in_stock = TRUE,
    updated_at = NOW()
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_inventory_stock IS 'Decrements inventory stock when orders are placed';
COMMENT ON FUNCTION increment_inventory_stock IS 'Increments inventory stock when orders are cancelled or restocked';
