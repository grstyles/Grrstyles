-- =========================================================================
-- GR STYLES - DUAL COUPON ENGINE & ORDER TRACKING MIGRATION
-- =========================================================================

-- 1. Ensure/Add columns on coupons table
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maximum_discount numeric(10, 2),
  ADD COLUMN IF NOT EXISTS minimum_purchase numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_cart_value numeric(10, 2),
  ADD COLUMN IF NOT EXISTS min_order_value numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS usage_per_user integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS applicable_products text[],
  ADD COLUMN IF NOT EXISTS applicable_categories text[],
  ADD COLUMN IF NOT EXISTS exclude_sale_products boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_order_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Migrate existing discount/active values for backward compatibility
UPDATE public.coupons 
SET 
  discount_value = COALESCE(NULLIF(discount_value, 0), NULLIF(discount, 0), NULLIF(discount_percent, 0), 0),
  discount_type = CASE WHEN discount_type IN ('flat', 'fixed') THEN 'fixed' ELSE 'percentage' END,
  minimum_purchase = COALESCE(NULLIF(minimum_purchase, 0), NULLIF(min_order_value, 0), 0),
  min_order_value = COALESCE(NULLIF(minimum_purchase, 0), NULLIF(min_order_value, 0), 0),
  expiry_date = COALESCE(expiry_date, end_date),
  end_date = COALESCE(expiry_date, end_date),
  is_active = COALESCE(is_active, active, true),
  active = COALESCE(is_active, active, true);

-- 3. Ensure/Add coupon tracking columns on orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS coupon_id text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric(10, 2),
  ADD COLUMN IF NOT EXISTS actual_discount_applied numeric(10, 2),
  ADD COLUMN IF NOT EXISTS final_total_after_discount numeric(10, 2);

-- 4. Enable Row Level Security (RLS) policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
CREATE POLICY "Allow public read access for coupons"
  ON public.coupons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin write access for coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admin write access for coupons"
  ON public.coupons FOR ALL
  USING (true)
  WITH CHECK (true);
