-- =========================================================================
-- MIGRATION: ATOMIC STOCK REDUCTION
-- Run this in the Supabase SQL Editor to prevent overselling race conditions.
-- =========================================================================

CREATE OR REPLACE FUNCTION reduce_stock(
  p_product_id uuid,
  p_size text,
  p_quantity integer,
  p_category text
) RETURNS boolean AS $$
DECLARE
  v_column text;
  v_is_json boolean := false;
  v_current_stock jsonb;
  v_current_size_stock integer;
  v_new_overall integer;
BEGIN
  -- Determine which column holds the stock based on category
  IF lower(p_category) LIKE '%shoe%' THEN
    v_column := 'shoe_stock';
    v_is_json := true;
  ELSIF lower(p_category) LIKE '%pant%' OR lower(p_category) LIKE '%jean%' OR lower(p_category) LIKE '%trouser%' OR lower(p_category) LIKE '%track%' THEN
    v_column := 'pant_stock';
    v_is_json := true;
  ELSIF lower(p_category) LIKE '%shirt%' OR lower(p_category) LIKE '%jacket%' OR lower(p_category) LIKE '%t-shirt%' THEN
    v_column := 'shirt_stock';
    v_is_json := true;
  ELSE
    v_column := 'overall_stock';
  END IF;

  -- Lock the row for update to prevent race conditions
  PERFORM 1 FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT v_is_json OR p_size = 'One Size' OR p_size = '' OR p_size IS NULL THEN
    -- Direct overall_stock reduction
    UPDATE products 
    SET overall_stock = GREATEST(0, overall_stock - p_quantity)
    WHERE id = p_product_id;
  ELSE
    -- JSONB reduction
    EXECUTE format('SELECT %I FROM products WHERE id = $1', v_column) INTO v_current_stock USING p_product_id;
    
    IF v_current_stock IS NULL THEN
      v_current_stock := '{}'::jsonb;
    END IF;
    
    v_current_size_stock := COALESCE((v_current_stock->>p_size)::integer, 0);
    
    -- Update JSONB
    v_current_stock := jsonb_set(
      v_current_stock, 
      ARRAY[p_size], 
      to_jsonb(GREATEST(0, v_current_size_stock - p_quantity))
    );
    
    -- Calculate new overall stock by summing values in the jsonb
    EXECUTE format('
      WITH stock_values AS (
        SELECT value::text::integer as v FROM jsonb_each($1)
      )
      SELECT sum(v) FROM stock_values
    ') INTO v_new_overall USING v_current_stock;
    
    -- Update the table
    EXECUTE format('
      UPDATE products 
      SET %I = $1, overall_stock = $2
      WHERE id = $3
    ', v_column) USING v_current_stock, v_new_overall, p_product_id;
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Stock reduction failed for product %: %', p_product_id, SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
