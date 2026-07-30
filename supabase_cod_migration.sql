-- =========================================================================
-- GR STYLES – COD (Cash on Delivery) Migration
-- Run this in the Supabase SQL Editor to enable COD payment support.
-- Safe to run multiple times (all statements are idempotent).
-- =========================================================================

-- 1. Drop the existing payment_status check constraint and recreate it with
--    'Refunded' included.  We use IF EXISTS so re-runs are safe.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded'));

-- 2. Ensure payment_method column exists (it already does in the live schema,
--    but this guard makes the migration idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'orders'
      AND column_name  = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method text NOT NULL DEFAULT 'razorpay';
  END IF;
END $$;

-- 3. Backfill: mark any historical rows that have a blank/null payment_method
--    as 'razorpay' so they display correctly in the UI.
UPDATE public.orders
SET payment_method = 'razorpay'
WHERE payment_method IS NULL OR payment_method = '';

-- 4. Add a check constraint for payment_method allowed values.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('razorpay', 'cod', 'upi', 'card', 'online', 'Prepaid', 'prepaid'));

-- 5. Ensure customer_email column alias exists for queries that use it.
--    The supabaseProvider reads 'customer_email' but the schema creates 'email'.
--    If the live DB uses 'customer_email', the below is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'orders'
      AND column_name  = 'customer_email'
  ) THEN
    -- Column is named 'email' in the original schema; alias via a generated column
    -- is not supported in Postgres, so we just confirm it exists as 'email'.
    RAISE NOTICE 'customer_email column not found; ensure your live schema uses customer_email or email consistently.';
  END IF;
END $$;

-- =========================================================================
-- STEP 2: Add cod_enabled to shipping_settings
-- This column controls whether COD is shown at checkout.
-- Default TRUE so existing stores keep COD available until toggled off.
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shipping_settings'
      AND column_name  = 'cod_enabled'
  ) THEN
    ALTER TABLE public.shipping_settings
      ADD COLUMN cod_enabled boolean NOT NULL DEFAULT true;
    RAISE NOTICE 'cod_enabled column added to shipping_settings';
  ELSE
    RAISE NOTICE 'cod_enabled column already exists in shipping_settings';
  END IF;
END $$;

-- Done.
SELECT 'COD migration applied successfully' AS result;
