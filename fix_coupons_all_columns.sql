-- =========================================================================
-- GR STYLES - COMPLETE COUPONS TABLE FIX
-- Run this ONCE in Supabase SQL Editor to fix ALL schema cache errors.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS everywhere.
-- =========================================================================

ALTER TABLE public.coupons
  -- Identity / naming
  ADD COLUMN IF NOT EXISTS name                  TEXT,
  ADD COLUMN IF NOT EXISTS description           TEXT,

  -- Discount fields
  ADD COLUMN IF NOT EXISTS discount_type         TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value        NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount              NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maximum_discount      NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS min_order_value       NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_purchase      NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_cart_value        NUMERIC(10, 2),

  -- Active status (two columns for backward compatibility)
  ADD COLUMN IF NOT EXISTS is_active             BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS active                BOOLEAN DEFAULT true,

  -- Dates
  ADD COLUMN IF NOT EXISTS start_date            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_date           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT timezone('utc', now()),

  -- Usage tracking
  ADD COLUMN IF NOT EXISTS usage_limit           INTEGER,
  ADD COLUMN IF NOT EXISTS usage_per_user        INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_count            INTEGER DEFAULT 0,

  -- Applicability / restrictions
  ADD COLUMN IF NOT EXISTS applicable_products   TEXT[],
  ADD COLUMN IF NOT EXISTS applicable_categories TEXT[],
  ADD COLUMN IF NOT EXISTS exclude_sale_products BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_order_only      BOOLEAN DEFAULT false;

-- =========================================================================
-- Sync values for columns that have two representations
-- =========================================================================
UPDATE public.coupons
SET
  discount_value   = COALESCE(NULLIF(discount_value, 0), discount, 0),
  discount         = COALESCE(NULLIF(discount_value, 0), discount, 0),
  minimum_purchase = COALESCE(NULLIF(minimum_purchase, 0), min_order_value, 0),
  min_order_value  = COALESCE(NULLIF(minimum_purchase, 0), min_order_value, 0),
  is_active        = COALESCE(is_active, active, true),
  active           = COALESCE(is_active, active, true),
  expiry_date      = COALESCE(expiry_date, end_date),
  end_date         = COALESCE(expiry_date, end_date);

-- =========================================================================
-- Ensure product_coupons join table exists
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.product_coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL REFERENCES public.coupons(code) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(coupon_code, product_id)
);

-- =========================================================================
-- RLS Policies
-- =========================================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_coupons ENABLE ROW LEVEL SECURITY;

-- Coupons: public read
DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
CREATE POLICY "Allow public read access for coupons"
  ON public.coupons FOR SELECT USING (true);

-- Coupons: admin write
DROP POLICY IF EXISTS "Allow authenticated admin write access for coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admin write access for coupons"
  ON public.coupons FOR ALL USING (true) WITH CHECK (true);

-- product_coupons: public read
DROP POLICY IF EXISTS "Allow public read access for product coupons" ON public.product_coupons;
CREATE POLICY "Allow public read access for product coupons"
  ON public.product_coupons FOR SELECT USING (true);

-- product_coupons: admin write
DROP POLICY IF EXISTS "Allow authenticated admin write access for product coupons" ON public.product_coupons;
CREATE POLICY "Allow authenticated admin write access for product coupons"
  ON public.product_coupons FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- DONE. All columns are now in place.
-- =========================================================================
