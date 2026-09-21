-- ============================================================
-- GR STYLES: Database Performance & Query Optimization Indexes
-- ============================================================
-- Safe, non-destructive migration script.
-- Uses `CREATE INDEX IF NOT EXISTS` to avoid conflicts or downtime.
-- Run in Supabase SQL Editor.
-- ============================================================

-- 1. Products Indexes (Catalog filtering, slug lookups, sorting, admin search)
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_created_at ON products (category, created_at DESC);

-- 2. Orders Indexes (User order history, admin filtering, status lookups)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);

-- 3. Order Items Indexes (Joins when fetching order details)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- 4. Cart & Cart Items Indexes (Fast cart hydration and sync)
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);

-- 5. Wishlists & Wishlist Items Indexes (Fast wishlist hydration and sync)
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items (wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items (product_id);

-- 6. User Addresses (Profile & checkout address retrieval)
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses (user_id);

-- 7. Reviews Indexes (Product details review loading)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);

-- 8. Coupons & Product Coupons Indexes (Fast checkout validation)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons (is_active);
CREATE INDEX IF NOT EXISTS idx_product_coupons_product_id ON product_coupons (product_id);
CREATE INDEX IF NOT EXISTS idx_product_coupons_coupon_id ON product_coupons (coupon_id);

-- 9. Category Carousels (Homepage categories query)
CREATE INDEX IF NOT EXISTS idx_category_carousels_display_order ON category_carousels (display_order);
