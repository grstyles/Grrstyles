-- ============================================================
-- GR STYLES – Cart & Wishlist Tables + RLS Policies
-- ============================================================
-- Run this entire script in the Supabase SQL Editor.
-- It is safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ============================================================
-- 1. CARTS table (one row per user — acts as a container)
-- ============================================================
create table if not exists public.carts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carts enable row level security;

-- Drop existing policies so the script is idempotent
drop policy if exists "Users can view own cart"   on public.carts;
drop policy if exists "Users can insert own cart"  on public.carts;
drop policy if exists "Users can update own cart"  on public.carts;
drop policy if exists "Users can delete own cart"  on public.carts;

create policy "Users can view own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can insert own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on public.carts for update
  using (auth.uid() = user_id);

create policy "Users can delete own cart"
  on public.carts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 2. CART_ITEMS table (individual products inside a cart)
-- ============================================================
create table if not exists public.cart_items (
  id            uuid default gen_random_uuid() primary key,
  cart_id       uuid references public.carts(id) on delete cascade not null,
  product_id    uuid references public.products(id) on delete cascade not null,
  size          text not null default '',
  shirt_size    text not null default '',
  pant_size     text not null default '',
  shoe_size     text not null default '',
  quantity      integer not null default 1 check (quantity > 0),
  custom_images jsonb default '[]'::jsonb,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cart_items enable row level security;

drop policy if exists "Users can view own cart items"   on public.cart_items;
drop policy if exists "Users can insert own cart items"  on public.cart_items;
drop policy if exists "Users can update own cart items"  on public.cart_items;
drop policy if exists "Users can delete own cart items"  on public.cart_items;

-- Cart items are accessible if the parent cart belongs to the current user
create policy "Users can view own cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can insert own cart items"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can update own cart items"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can delete own cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. WISHLISTS table (one row per user — acts as a container)
-- ============================================================
create table if not exists public.wishlists (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wishlists enable row level security;

drop policy if exists "Users can view own wishlist"   on public.wishlists;
drop policy if exists "Users can insert own wishlist"  on public.wishlists;
drop policy if exists "Users can update own wishlist"  on public.wishlists;
drop policy if exists "Users can delete own wishlist"  on public.wishlists;

create policy "Users can view own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wishlist"
  on public.wishlists for update
  using (auth.uid() = user_id);

create policy "Users can delete own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 4. WISHLIST_ITEMS table (individual products in a wishlist)
-- ============================================================
create table if not exists public.wishlist_items (
  id          uuid default gen_random_uuid() primary key,
  wishlist_id uuid references public.wishlists(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (wishlist_id, product_id)
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Users can view own wishlist items"   on public.wishlist_items;
drop policy if exists "Users can insert own wishlist items"  on public.wishlist_items;
drop policy if exists "Users can delete own wishlist items"  on public.wishlist_items;

create policy "Users can view own wishlist items"
  on public.wishlist_items for select
  using (
    exists (
      select 1 from public.wishlists
      where wishlists.id = wishlist_items.wishlist_id
        and wishlists.user_id = auth.uid()
    )
  );

create policy "Users can insert own wishlist items"
  on public.wishlist_items for insert
  with check (
    exists (
      select 1 from public.wishlists
      where wishlists.id = wishlist_items.wishlist_id
        and wishlists.user_id = auth.uid()
    )
  );

create policy "Users can delete own wishlist items"
  on public.wishlist_items for delete
  using (
    exists (
      select 1 from public.wishlists
      where wishlists.id = wishlist_items.wishlist_id
        and wishlists.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. RLS for existing tables that may be missing policies
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile"  on public.profiles;
drop policy if exists "Admins can view all profiles"  on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow admins to read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.admins where user_id = auth.uid()
    )
  );

-- ORDERS
alter table public.orders enable row level security;
drop policy if exists "Users can view own orders"    on public.orders;
drop policy if exists "Users can create own orders"  on public.orders;
drop policy if exists "Admins can view all orders"   on public.orders;
drop policy if exists "Admins can update all orders" on public.orders;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "Admins can update all orders"
  on public.orders for update
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- ORDER_ITEMS
alter table public.order_items enable row level security;
drop policy if exists "Users can view own order items" on public.order_items;
drop policy if exists "Users can create order items"   on public.order_items;
drop policy if exists "Admins can view all order items" on public.order_items;

create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Users can create order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins can view all order items"
  on public.order_items for select
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- PRODUCTS (read-only for everyone, write for admins only)
alter table public.products enable row level security;
drop policy if exists "Public can view products"   on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "Public can view products"
  on public.products for select
  using (true);

create policy "Admins can manage products"
  on public.products for all
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- BANNERS (read-only for everyone, write for admins only)
alter table public.banners enable row level security;
drop policy if exists "Public can view banners"   on public.banners;
drop policy if exists "Admins can manage banners" on public.banners;

create policy "Public can view banners"
  on public.banners for select
  using (true);

create policy "Admins can manage banners"
  on public.banners for all
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- COUPONS (read-only for everyone)
alter table public.coupons enable row level security;
drop policy if exists "Public can view coupons"   on public.coupons;
drop policy if exists "Admins can manage coupons" on public.coupons;

create policy "Public can view coupons"
  on public.coupons for select
  using (true);

create policy "Admins can manage coupons"
  on public.coupons for all
  using (exists (select 1 from public.admins where user_id = auth.uid()));
