-- Supabase SQL Migration
-- Run this in the Supabase SQL Editor to create and seed the category_carousel table

CREATE TABLE IF NOT EXISTS public.category_carousel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    bg_color TEXT DEFAULT '#F9F7F5',
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    redirect_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.category_carousel ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Access" 
ON public.category_carousel 
FOR SELECT 
USING (true);

-- Allow full admin access (assuming you have an admin role or authenticated users policy)
CREATE POLICY "Admin Full Access"
ON public.category_carousel
FOR ALL
USING (auth.role() = 'authenticated');

-- Clean old entries if any exist
DELETE FROM public.category_carousel;

-- Insert the 21 Premium Categories
INSERT INTO public.category_carousel (title, slug, image_url, bg_color, priority, enabled, featured, redirect_link) VALUES
('Combo Offers', 'combo-offers', '/images/categories/home_hero_banner_1781859591521.png', '#F9F7F5', 0, true, false, '/collections/combo-offers'),
('Korean Collections', 'korean-collections', '/images/categories/korean_collection_1781859616593.png', '#F9F7F5', 1, true, false, '/collections/korean-collections'),
('Baggy Pants', 'baggy-pants', '/images/categories/baggy_pants_1782999816436.png', '#F9F7F5', 2, true, false, '/collections/baggy-pants'),
('Korean Trousers', 'korean-trousers', '/images/categories/trousers_1781973187005.png', '#F9F7F5', 3, true, false, '/collections/korean-trousers'),
('Shoes', 'shoes', '/images/categories/shoes_1781859704333.png', '#F9F7F5', 4, true, false, '/collections/shoes'),
('Traditional Collections', 'traditional-collections', '/images/categories/festival_wear.png', '#F9F7F5', 5, true, false, '/collections/traditional-collections'),
('Festival Collections', 'festival-collections', '/images/categories/festival_collection_1781859912718.png', '#F9F7F5', 6, true, false, '/collections/festival-collections'),
('Trending Collections', 'trending-collections', '/images/categories/weekend_collection_1781859935252.png', '#F9F7F5', 7, true, false, '/collections/trending-collections'),
('Shirts', 'shirts', '/images/categories/shirts_1782999677203.png', '#F9F7F5', 8, true, false, '/collections/shirts'),
('T-Shirts', 't-shirts', '/images/categories/t_shirts_1781973106261.png', '#F9F7F5', 9, true, false, '/collections/t-shirts'),
('Jackets', 'jackets', '/images/categories/jackets_1782999862529.png', '#F9F7F5', 10, true, false, '/collections/jackets'),
('Night Tracks', 'night-tracks', '/images/categories/sweatshirts_1782999892937.png', '#F9F7F5', 11, true, false, '/collections/night-tracks'),
('Accessories', 'accessories', '/images/categories/accessories_1781859683256.png', '#F9F7F5', 12, true, false, '/collections/accessories'),
('Formal Combos', 'formal-combos', '/images/categories/blazers_1781973264858.png', '#F9F7F5', 13, true, false, '/collections/formal-combos'),
('Formal Pants', 'formal-pants', '/images/categories/formal_pants_1782999794308.png', '#F9F7F5', 14, true, false, '/collections/formal-pants'),
('Formal Shirts', 'formal-shirts', '/images/categories/formal_shirts_1782999741005.png', '#F9F7F5', 15, true, false, '/collections/formal-shirts'),
('Trousers', 'trousers', '/images/categories/trousers_1782999782089.png', '#F9F7F5', 16, true, false, '/collections/trousers'),
('Denim Jeans', 'denim-jeans', '/images/categories/denim_jeans_1781859861521.png', '#F9F7F5', 17, true, false, '/collections/denim-jeans'),
('Printed Shirts', 'printed-shirts', '/images/categories/printed_shirts_1782999700299.png', '#F9F7F5', 18, true, false, '/collections/printed-shirts'),
('Festival Offers', 'festival-offers', '/images/categories/banner_4_1782126942281.png', '#F9F7F5', 19, true, false, '/collections/festival-offers'),
('Weekend Offers', 'weekend-offers', '/images/categories/banner_5_1782126961549.png', '#F9F7F5', 20, true, false, '/collections/weekend-offers');
