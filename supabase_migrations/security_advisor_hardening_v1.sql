-- =============================================================================
-- GR STYLES - SUPABASE SECURITY ADVISOR HARDENING & RLS REMEDIATION
-- Migration: security_advisor_hardening_v1.sql
-- =============================================================================
-- Safe, production-grade, 100% idempotent migration script.
--
-- Resolves:
--  1. function_search_path_mutable (SET search_path = '' on all SECURITY DEFINER / trigger functions)
--  2. Insecure permissive RLS policies (WITH CHECK (true), USING (true) on sensitive tables)
--  3. Preserves public storefront read access for products, categories, coupons, banners, etc.
--  4. Enforces strict auth.uid() owner isolation for profiles, orders, carts, wishlists, addresses.
--  5. Locks down admin operations strictly to public.is_admin().
--  6. Handles missing tables gracefully with IF EXISTS / CREATE TABLE IF NOT EXISTS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: ENSURE ALL EXTENSIONS & CORE TABLES EXIST
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  collection TEXT,
  color TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  mrp_price NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(10, 2) NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  label TEXT DEFAULT '',
  description TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  trending BOOLEAN DEFAULT false,
  new_arrival BOOLEAN DEFAULT false,
  deal_of_the_day BOOLEAN DEFAULT false,
  brand TEXT DEFAULT 'GR STYLES',
  rating NUMERIC(3, 2) DEFAULT 5.00,
  reviews_count INTEGER DEFAULT 0,
  shirt_stock JSONB DEFAULT '{}'::jsonb,
  pant_stock JSONB DEFAULT '{}'::jsonb,
  shoe_stock JSONB DEFAULT '{}'::jsonb,
  overall_stock INTEGER DEFAULT 0,
  delivery_charge_enabled BOOLEAN DEFAULT false,
  delivery_charge NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  maximum_discount NUMERIC(10, 2),
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  minimum_purchase NUMERIC(10, 2) DEFAULT 0,
  max_cart_value NUMERIC(10, 2),
  usage_limit INTEGER,
  usage_per_user INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  applicable_products TEXT[],
  applicable_categories TEXT[],
  exclude_sale_products BOOLEAN DEFAULT false,
  first_order_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Product Coupons Join Table
CREATE TABLE IF NOT EXISTS public.product_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL REFERENCES public.coupons(code) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(coupon_code, product_id)
);

-- 1.8 Product Images Color Mapping Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  color_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.9 Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  customer_email TEXT,
  phone TEXT,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'razorpay',
  total_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  subtotal NUMERIC(10, 2),
  shipping_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_signature TEXT,
  gateway TEXT DEFAULT 'razorpay',
  transaction_time TIMESTAMPTZ,
  tracking_id TEXT,
  tracking_url TEXT,
  courier_partner TEXT,
  dispatch_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  alternate_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.10 Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  signature TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'Success',
  paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.12 Carts & Cart Items Tables
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  shirt_size TEXT NOT NULL DEFAULT '',
  pant_size TEXT NOT NULL DEFAULT '',
  shoe_size TEXT NOT NULL DEFAULT '',
  selected_color TEXT DEFAULT '',
  selected_image TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  custom_images JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.13 Wishlists & Wishlist Items Tables
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (wishlist_id, product_id)
);

-- 1.14 User Addresses Table
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.15 Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link TEXT,
  button_text TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_page TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.16 Category Carousel Table
CREATE TABLE IF NOT EXISTS public.category_carousel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  bg_color TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  redirect_link TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 1.17 Shipping Settings Table
CREATE TABLE IF NOT EXISTS public.shipping_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 80.00,
  free_shipping_above NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
  single_product_charge NUMERIC(10, 2) NOT NULL DEFAULT 80.00,
  pant_charge NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
  combo_charge NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  free_delivery BOOLEAN NOT NULL DEFAULT false,
  estimated_delivery TEXT NOT NULL DEFAULT '3-5 days',
  shipping_message TEXT NOT NULL DEFAULT 'Free delivery for orders above {remaining}.',
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- -----------------------------------------------------------------------------
-- SECTION 2: CORE HELPER & TRIGGER FUNCTIONS (search_path hardened)
-- -----------------------------------------------------------------------------

-- 2.1 Admin verification helper (SECURITY DEFINER + search_path = '')
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2.2 Timestamp triggers (search_path = '')
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- 2.3 Automatic profile creation trigger (SECURITY DEFINER + search_path = '')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    pg_catalog.coalesce(NEW.email, ''),
    pg_catalog.coalesce(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      pg_catalog.split_part(pg_catalog.coalesce(NEW.email, 'User'), '@', 1)
    ),
    pg_catalog.coalesce(NEW.raw_user_meta_data->>'role', 'customer'),
    pg_catalog.coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = pg_catalog.coalesce(pg_catalog.nullif(EXCLUDED.full_name, ''), public.profiles.full_name),
      avatar_url = pg_catalog.coalesce(pg_catalog.nullif(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);

  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    INSERT INTO public.admins (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2.4 Atomic stock reduction (SECURITY DEFINER + search_path = '' + fully schema qualified)
CREATE OR REPLACE FUNCTION public.reduce_stock(
  p_product_id uuid,
  p_size text,
  p_quantity integer,
  p_category text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_column text;
  v_is_json boolean := false;
  v_current_stock jsonb;
  v_current_size_stock integer;
  v_new_overall integer;
BEGIN
  -- Determine which column holds the stock based on category
  IF pg_catalog.lower(p_category) LIKE '%shoe%' THEN
    v_column := 'shoe_stock';
    v_is_json := true;
  ELSIF pg_catalog.lower(p_category) LIKE '%pant%' OR pg_catalog.lower(p_category) LIKE '%jean%' OR pg_catalog.lower(p_category) LIKE '%trouser%' OR pg_catalog.lower(p_category) LIKE '%track%' THEN
    v_column := 'pant_stock';
    v_is_json := true;
  ELSIF pg_catalog.lower(p_category) LIKE '%shirt%' OR pg_catalog.lower(p_category) LIKE '%jacket%' OR pg_catalog.lower(p_category) LIKE '%t-shirt%' THEN
    v_column := 'shirt_stock';
    v_is_json := true;
  ELSE
    v_column := 'overall_stock';
  END IF;

  -- Lock the row for update to prevent race conditions
  PERFORM 1 FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF NOT v_is_json OR p_size = 'One Size' OR p_size = '' OR p_size IS NULL THEN
    -- Direct overall_stock reduction
    UPDATE public.products 
    SET overall_stock = pg_catalog.greatest(0, overall_stock - p_quantity)
    WHERE id = p_product_id;
  ELSE
    -- JSONB reduction
    EXECUTE pg_catalog.format('SELECT %I FROM public.products WHERE id = $1', v_column) INTO v_current_stock USING p_product_id;
    
    IF v_current_stock IS NULL THEN
      v_current_stock := '{}'::jsonb;
    END IF;
    
    v_current_size_stock := pg_catalog.coalesce((v_current_stock->>p_size)::integer, 0);
    
    -- Update JSONB
    v_current_stock := jsonb_set(
      v_current_stock, 
      ARRAY[p_size], 
      to_jsonb(pg_catalog.greatest(0, v_current_size_stock - p_quantity))
    );
    
    -- Calculate new overall stock by summing values in the jsonb
    EXECUTE '
      WITH stock_values AS (
        SELECT value::text::integer as v FROM jsonb_each($1)
      )
      SELECT sum(v) FROM stock_values
    ' INTO v_new_overall USING v_current_stock;
    
    -- Update the table
    EXECUTE pg_catalog.format('
      UPDATE public.products 
      SET %I = $1, overall_stock = $2
      WHERE id = $3
    ', v_column) USING v_current_stock, v_new_overall, p_product_id;
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Stock reduction failed for product %: %', p_product_id, SQLERRM;
  RETURN false;
END;
$$;


-- -----------------------------------------------------------------------------
-- SECTION 3: ROW LEVEL SECURITY ACTIVATION
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- SECTION 4: RLS POLICY RE-CONFIGURATION (LEAST PRIVILEGE)
-- -----------------------------------------------------------------------------

-- 4.1 PROFILES
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile or admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to delete profiles" ON public.profiles;

CREATE POLICY "Allow users to read own profile or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow users to update own profile or admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow users to insert own profile or admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow admin to delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 4.2 ADMINS
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Allow admin access to admins" ON public.admins;

CREATE POLICY "Allow admin access to admins"
  ON public.admins FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.3 PRODUCTS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for products" ON public.products;
DROP POLICY IF EXISTS "Allow admin write access for products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Allow public read access for products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.4 CATEGORIES (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin write access for categories" ON public.categories;

CREATE POLICY "Allow public read access for categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.5 COLLECTIONS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for collections" ON public.collections;
DROP POLICY IF EXISTS "Allow admin write access for collections" ON public.collections;

CREATE POLICY "Allow public read access for collections"
  ON public.collections FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for collections"
  ON public.collections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.6 COUPONS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow admin write access for coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow authenticated admin write access for coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Allow public read access for coupons"
  ON public.coupons FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.7 PRODUCT_COUPONS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for product coupons" ON public.product_coupons;
DROP POLICY IF EXISTS "Allow authenticated admin write access for product coupons" ON public.product_coupons;

CREATE POLICY "Allow public read access for product coupons"
  ON public.product_coupons FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for product coupons"
  ON public.product_coupons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.8 PRODUCT_IMAGES (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated admin write access for product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow public read access on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated insert on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated update on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated delete on product_images" ON public.product_images;

CREATE POLICY "Allow public read access for product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for product images"
  ON public.product_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.9 BANNERS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for banners" ON public.banners;
DROP POLICY IF EXISTS "Allow admin write access for banners" ON public.banners;
DROP POLICY IF EXISTS "Public can view banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;

CREATE POLICY "Allow public read access for banners"
  ON public.banners FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for banners"
  ON public.banners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.10 CATEGORY_CAROUSEL (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Public Read Access on category_carousel" ON public.category_carousel;
DROP POLICY IF EXISTS "Admin Insert Access on category_carousel" ON public.category_carousel;
DROP POLICY IF EXISTS "Admin Update Access on category_carousel" ON public.category_carousel;
DROP POLICY IF EXISTS "Admin Delete Access on category_carousel" ON public.category_carousel;
DROP POLICY IF EXISTS "Allow public read access for category_carousel" ON public.category_carousel;
DROP POLICY IF EXISTS "Allow admin write access for category_carousel" ON public.category_carousel;

CREATE POLICY "Allow public read access for category_carousel"
  ON public.category_carousel FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for category_carousel"
  ON public.category_carousel FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.11 SHIPPING_SETTINGS (Storefront Public Read, Admin Manage)
DROP POLICY IF EXISTS "Allow public read access for shipping_settings" ON public.shipping_settings;
DROP POLICY IF EXISTS "Allow admin write access for shipping_settings" ON public.shipping_settings;

CREATE POLICY "Allow public read access for shipping_settings"
  ON public.shipping_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access for shipping_settings"
  ON public.shipping_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.12 ORDERS (User Isolation + Admin Full Access)
DROP POLICY IF EXISTS "Allow users to read own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to update or delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders or admin" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;

CREATE POLICY "Users can view own orders or admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own orders or admin"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 4.13 ORDER_ITEMS (User Isolation + Admin Full Access)
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items or admin" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items or admin" ON public.order_items;
DROP POLICY IF EXISTS "Admin can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can delete order items" ON public.order_items;

CREATE POLICY "Users can view own order items or admin"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items or admin"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 4.14 PAYMENTS (User Isolation + Admin Full Access)
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments or admin" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments or admin" ON public.payments;
DROP POLICY IF EXISTS "Admin can manage payments" ON public.payments;

CREATE POLICY "Users can view own payments or admin"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own payments or admin"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 4.15 CARTS & CART_ITEMS (User Isolation)
DROP POLICY IF EXISTS "Users can view own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can insert own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can update own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can delete own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can view own cart or admin" ON public.carts;
DROP POLICY IF EXISTS "Users can insert own cart or admin" ON public.carts;
DROP POLICY IF EXISTS "Users can update own cart or admin" ON public.carts;
DROP POLICY IF EXISTS "Users can delete own cart or admin" ON public.carts;

CREATE POLICY "Users can view own cart or admin"
  ON public.carts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own cart or admin"
  ON public.carts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own cart or admin"
  ON public.carts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own cart or admin"
  ON public.carts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items or admin" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items or admin" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items or admin" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items or admin" ON public.cart_items;

CREATE POLICY "Users can view own cart items or admin"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cart items or admin"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cart items or admin"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own cart items or admin"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );


-- 4.16 WISHLISTS & WISHLIST_ITEMS (User Isolation)
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist or admin" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlist or admin" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update own wishlist or admin" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist or admin" ON public.wishlists;

CREATE POLICY "Users can view own wishlist or admin"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own wishlist or admin"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own wishlist or admin"
  ON public.wishlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own wishlist or admin"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can view own wishlist items or admin" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist items or admin" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist items or admin" ON public.wishlist_items;

CREATE POLICY "Users can view own wishlist items or admin"
  ON public.wishlist_items FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own wishlist items or admin"
  ON public.wishlist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own wishlist items or admin"
  ON public.wishlist_items FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
        AND wishlists.user_id = auth.uid()
    )
  );


-- 4.17 USER_ADDRESSES (User Isolation)
DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can view own addresses or admin" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses or admin" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses or admin" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses or admin" ON public.user_addresses;

CREATE POLICY "Users can view own addresses or admin"
  ON public.user_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own addresses or admin"
  ON public.user_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own addresses or admin"
  ON public.user_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own addresses or admin"
  ON public.user_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());


-- -----------------------------------------------------------------------------
-- SECTION 5: STORAGE OBJECTS RLS HARDENING
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public Access on category-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload on category-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update on category-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete on category-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for store assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload store assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update store assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete store assets" ON storage.objects;

-- Allow public read access to all public store assets
CREATE POLICY "Public Read Access for store assets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products', 'product-images', 'banners', 'collections', 'brands', 'reviews', 'custom_uploads', 'category-images'));

-- Allow admins to upload/modify store catalog images
CREATE POLICY "Admin Upload store assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin Update store assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete store assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- SECTION 6: NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
