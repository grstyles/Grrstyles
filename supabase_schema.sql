-- =========================================================================
-- GR STYLES - DATABASE SCHEMA MIGRATION SCRIPT
-- Copy and paste this script into the Supabase SQL Editor to configure the backend.
-- =========================================================================

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Admins Table (For quick role-based permission verification)
create table if not exists public.admins (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Collections Table
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  product_id text, -- legacy support ID
  sku text unique not null,
  name text not null,
  slug text unique not null,
  category text not null,
  collection text,
  color text not null,
  images text[] not null default '{}',
  sizes jsonb not null default '[]'::jsonb, -- e.g. [{"size":"M","stock":5}]
  mrp_price numeric(10, 2) not null,
  selling_price numeric(10, 2) not null,
  discount_percent integer not null default 0,
  label text default '',
  description text not null,
  featured boolean default false,
  trending boolean default false,
  new_arrival boolean default false,
  deal_of_the_day boolean default false,
  brand text default 'GR STYLES',
  rating numeric(3, 2) default 5.00,
  reviews_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Coupons Table
create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null, -- e.g. GR-2026-XXXXXX
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  shipping_address jsonb not null, -- {address, city, state, zip, country}
  payment_method text not null,
  total_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null default 0,
  coupon_code text references public.coupons(code),
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Order Items Table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null
);

-- 9. Cart Table (Backend Sync)
create table if not exists public.cart (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id, size)
);

-- 10. Wishlist Table (Backend Sync)
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- 11. Reviews Table (Customer reviews & ratings)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Banners Table (Homepage hero slide controls)
create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  link text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- INITIAL SEEDS
-- =========================================================================

-- Seed standard coupons
insert into public.coupons (code, discount_percent, description, is_active)
values 
  ('WELCOME10', 10, '10% off on your first order', true),
  ('WEEKEND10', 10, '10% off for weekend specials', true),
  ('FESTIVAL20', 20, '20% discount on festive wear orders', true)
on conflict (code) do update 
set discount_percent = excluded.discount_percent, description = excluded.description, is_active = excluded.is_active;

-- =========================================================================
-- STORAGE BUCKETS SETUP
-- =========================================================================

-- Create buckets if they do not exist
insert into storage.buckets (id, name, public)
values 
  ('products', 'products', true),
  ('banners', 'banners', true),
  ('collections', 'collections', true),
  ('brands', 'brands', true)
on conflict (id) do nothing;

-- Set public policy access for all buckets (so image links are accessible)
create policy "Public Access" on storage.objects for select using (true);

-- =========================================================================
-- SECURITY & PROFILES SYNCHRONIZATION TRIGGER
-- =========================================================================

-- Automatic Profile Creation on SignUp Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  
  -- If role metadata is 'admin', automatically add to admins verification table
  if (new.raw_user_meta_data->>'role') = 'admin' then
    insert into public.admins (user_id) values (new.id) on conflict do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
