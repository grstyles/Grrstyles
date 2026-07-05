ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure product_coupons table exists for linking coupons to specific products
CREATE TABLE IF NOT EXISTS product_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL REFERENCES coupons(code) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_code, product_id)
);
