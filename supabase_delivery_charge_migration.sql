-- Migration: Add Product-Level Delivery Charge fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS delivery_charge_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.products.delivery_charge_enabled IS 'Toggle to apply custom delivery charge for this product instead of global shipping settings';
COMMENT ON COLUMN public.products.delivery_charge IS 'Custom delivery charge amount in INR for this product when delivery_charge_enabled is true';
