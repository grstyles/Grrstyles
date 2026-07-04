-- Dynamic Inventory Migration Script

-- 1. Add new inventory columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS shirt_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pant_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shoe_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS overall_stock INTEGER DEFAULT 0;

-- 2. Migrate existing data from the legacy 'sizes' array to the new JSONB objects safely.
DO $$
DECLARE
    row RECORD;
    shirt_obj JSONB;
    pant_obj JSONB;
    shoe_obj JSONB;
    overall INT;
    size_elem JSONB;
    s_name TEXT;
    s_stock INT;
BEGIN
    FOR row IN SELECT id, sizes, category FROM products WHERE sizes IS NOT NULL AND jsonb_array_length(sizes) > 0
    LOOP
        shirt_obj := '{}'::jsonb;
        pant_obj := '{}'::jsonb;
        shoe_obj := '{}'::jsonb;
        overall := 0;

        FOR size_elem IN SELECT * FROM jsonb_array_elements(row.sizes)
        LOOP
            s_name := size_elem->>'size';
            s_stock := (size_elem->>'stock')::INT;
            overall := overall + s_stock;

            IF s_name IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL') THEN
                shirt_obj := jsonb_set(shirt_obj, ARRAY[s_name], to_jsonb(s_stock));
            ELSIF s_name IN ('28', '30', '32', '34', '36', '38', '40', '42') THEN
                pant_obj := jsonb_set(pant_obj, ARRAY[s_name], to_jsonb(s_stock));
            ELSE
                shoe_obj := jsonb_set(shoe_obj, ARRAY[s_name], to_jsonb(s_stock));
            END IF;
        END LOOP;

        -- Update the row based on the category logic mapping
        IF row.category IN ('Shirts', 'Printed Shirts', 'T-Shirts', 'Formal Shirts', 'Korean Collection', 'Jackets', 'Night Tracks') THEN
            UPDATE products SET shirt_stock = shirt_obj, overall_stock = overall WHERE id = row.id;
        ELSIF row.category IN ('Baggy Pants', 'Korean Trousers', 'Formal Pant', 'Trousers', 'Denim Jeans') THEN
            UPDATE products SET pant_stock = pant_obj, overall_stock = overall WHERE id = row.id;
        ELSIF row.category IN ('Shoes') THEN
            UPDATE products SET shoe_stock = shoe_obj, overall_stock = overall WHERE id = row.id;
        ELSIF row.category IN ('Combo Offer', 'Formal Combo') THEN
            UPDATE products SET shirt_stock = shirt_obj, pant_stock = pant_obj, overall_stock = overall WHERE id = row.id;
        ELSE
            UPDATE products SET overall_stock = overall WHERE id = row.id;
        END IF;

    END LOOP;
END $$;

-- 3. Add separated size columns to cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS pant_size TEXT;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS shoe_size TEXT;

-- 4. We do NOT drop the 'sizes' column here to preserve legacy data until everything is verified.
-- After verifying the storefront works, you can run:
-- ALTER TABLE products DROP COLUMN sizes;
