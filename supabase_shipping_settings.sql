-- =========================================================================
-- GR STYLES - SHIPPING SETTINGS MIGRATION SCRIPT
-- Copy and paste this script into the Supabase SQL Editor to configure the backend.
-- =========================================================================

-- 1. Create public.shipping_settings table
CREATE TABLE IF NOT EXISTS public.shipping_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CONSTRAINT single_row CHECK (id = 1),
    shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    free_shipping_above NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    single_product_charge NUMERIC(10, 2) NOT NULL DEFAULT 80.00,
    pant_charge NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    combo_charge NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
    free_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_delivery TEXT NOT NULL DEFAULT '3-5 days',
    shipping_message TEXT NOT NULL DEFAULT 'Free delivery for orders above {remaining}.'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Seed initial default values
INSERT INTO public.shipping_settings (id, shipping_charge, free_shipping_above)
VALUES (1, 100.00, 2000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access for shipping_settings" ON public.shipping_settings;
CREATE POLICY "Allow public read access for shipping_settings"
    ON public.shipping_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin write access for shipping_settings" ON public.shipping_settings;
CREATE POLICY "Allow admin write access for shipping_settings"
    ON public.shipping_settings FOR ALL
    USING (public.is_admin());
