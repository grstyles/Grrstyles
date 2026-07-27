-- =========================================================================
-- MIGRATION: PERMANENT ORDERS ARCHITECTURE
-- Run this in the Supabase SQL Editor.
-- =========================================================================

-- 1. Alter Orders Table to support tracking and payment details
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subtotal numeric(10, 2),
ADD COLUMN IF NOT EXISTS shipping_amount numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS razorpay_order_id text,
ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
ADD COLUMN IF NOT EXISTS payment_signature text,
ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'razorpay',
ADD COLUMN IF NOT EXISTS transaction_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS tracking_id text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS courier_partner text,
ADD COLUMN IF NOT EXISTS dispatch_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS expected_delivery_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_date timestamp with time zone;

-- Update the check constraint for order_status to allow 'Processing' and others if missing
-- Drop the existing constraint first
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status in ('Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'));

-- Drop the existing constraint for payment_status to allow lowercase matching or other statuses if needed
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status in ('Pending', 'Paid', 'Failed', 'Refunded'));

-- 2. Alter order_items to support tracking properties if they are needed at the item level
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_payment_id text UNIQUE NOT NULL,
  razorpay_order_id text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  signature text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  status text NOT NULL DEFAULT 'Success',
  paid_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS (Row Level Security) and configure Policies

-- Orders Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can manage orders'
    ) THEN
        CREATE POLICY "Admins can manage orders" ON public.orders
        FOR ALL
        USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view own orders'
    ) THEN
        CREATE POLICY "Users can view own orders" ON public.orders
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert own orders'
    ) THEN
        CREATE POLICY "Users can insert own orders" ON public.orders
        FOR INSERT
        WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
    END IF;
END $$;

-- Order Items Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can manage order items'
    ) THEN
        CREATE POLICY "Admins can manage order items" ON public.order_items
        FOR ALL
        USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can view own order items'
    ) THEN
        CREATE POLICY "Users can view own order items" ON public.order_items
        FOR SELECT
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can insert own order items'
    ) THEN
        CREATE POLICY "Users can insert own order items" ON public.order_items
        FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)));
    END IF;
END $$;

-- Payments Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can manage payments'
    ) THEN
        CREATE POLICY "Admins can manage payments" ON public.payments
        FOR ALL
        USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments'
    ) THEN
        CREATE POLICY "Users can view own payments" ON public.payments
        FOR SELECT
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
    ) THEN
        CREATE POLICY "Users can insert own payments" ON public.payments
        FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)));
    END IF;
END $$;

-- 5. Drop temp_orders if it exists (safely)
DROP TABLE IF EXISTS public.temp_orders CASCADE;
