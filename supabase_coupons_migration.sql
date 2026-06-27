-- =========================================================================
-- GR STYLES - COUPON SYSTEM ENHANCEMENT MIGRATION
-- =========================================================================

-- 1. Add new columns to existing coupons table
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
  ADD COLUMN IF NOT EXISTS discount_value numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_order_value numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0;

-- 2. Migrate existing discount_percent to discount_value
UPDATE public.coupons 
SET discount_value = discount_percent, discount_type = 'percentage' 
WHERE discount_percent > 0 AND discount_value = 0;

-- 3. Create product_coupons join table
CREATE TABLE IF NOT EXISTS public.product_coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  coupon_id text REFERENCES public.coupons(code) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, coupon_id)
);

-- 4. Enable Row Level Security (RLS) on product_coupons
ALTER TABLE public.product_coupons ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for product_coupons
DROP POLICY IF EXISTS "Allow public read access for product coupons" ON public.product_coupons;
CREATE POLICY "Allow public read access for product coupons"
  ON public.product_coupons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin write access for product coupons" ON public.product_coupons;
CREATE POLICY "Allow authenticated admin write access for product coupons"
  ON public.product_coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 6. Ensure coupons table has correct RLS for SELECT
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
CREATE POLICY "Allow public read access for coupons"
  ON public.coupons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin write access for coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admin write access for coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
