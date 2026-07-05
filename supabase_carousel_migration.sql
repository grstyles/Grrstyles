-- SQL Migration for Category Carousel Redesign

-- 1. Create the category_carousel table
CREATE TABLE IF NOT EXISTS category_carousel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    bg_color TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    redirect_link TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE category_carousel ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Access on category_carousel" 
ON category_carousel FOR SELECT USING (true);

-- Allow authenticated admins to insert/update/delete
-- Assuming is_admin() function exists, if not, use authenticated users for demo
CREATE POLICY "Admin Insert Access on category_carousel" 
ON category_carousel FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin Update Access on category_carousel" 
ON category_carousel FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Delete Access on category_carousel" 
ON category_carousel FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Create the category-images Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Access on category-images" 
ON storage.objects FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Admin Upload on category-images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Update on category-images" 
ON storage.objects FOR UPDATE USING (bucket_id = 'category-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Delete on category-images" 
ON storage.objects FOR DELETE USING (bucket_id = 'category-images' AND auth.role() = 'authenticated');

-- 3. Seed Default Categories (Matches the premium fashion brand requirements)
INSERT INTO category_carousel (title, slug, image_url, bg_color, priority) VALUES 
('Shirts', 'shirts', '/images/category-placeholder.png', '#F5F5DC', 0),
('Printed Shirts', 'printed-shirts', '/images/category-placeholder.png', '#F8DE7E', 1),
('Oversized T-Shirts', 'oversized-t-shirts', '/images/category-placeholder.png', '#FFFDD0', 2),
('Polo T-Shirts', 'polo-t-shirts', '/images/category-placeholder.png', '#808000', 3),
('Trousers', 'trousers', '/images/category-placeholder.png', '#C2B280', 4),
('Cargo Pants', 'cargo-pants', '/images/category-placeholder.png', '#B5651D', 5),
('Jeans', 'jeans', '/images/category-placeholder.png', '#1560BD', 6),
('Hoodies', 'hoodies', '/images/category-placeholder.png', '#808080', 7),
('Sweatshirts', 'sweatshirts', '/images/category-placeholder.png', '#696969', 8),
('Jackets', 'jackets', '/images/category-placeholder.png', '#A9A9A9', 9),
('Blazers', 'blazers', '/images/category-placeholder.png', '#800000', 10),
('Co-ord Sets', 'co-ord-sets', '/images/category-placeholder.png', '#556B2F', 11),
('Shorts', 'shorts', '/images/category-placeholder.png', '#708090', 12),
('Joggers', 'joggers', '/images/category-placeholder.png', '#2F4F4F', 13),
('Ethnic Wear', 'ethnic-wear', '/images/category-placeholder.png', '#FFDB58', 14),
('Formal Wear', 'formal-wear', '/images/category-placeholder.png', '#000080', 15),
('Casual Wear', 'casual-wear', '/images/category-placeholder.png', '#D2B48C', 16),
('Winter Collection', 'winter-collection', '/images/category-placeholder.png', '#ADD8E6', 17),
('Footwear', 'footwear', '/images/category-placeholder.png', '#8B4513', 18),
('Sneakers', 'sneakers', '/images/category-placeholder.png', '#A0522D', 19),
('Loafers', 'loafers', '/images/category-placeholder.png', '#D2691E', 20),
('Accessories', 'accessories', '/images/category-placeholder.png', '#FFFFF0', 21),
('Watches', 'watches', '/images/category-placeholder.png', '#C0C0C0', 22),
('Wallets', 'wallets', '/images/category-placeholder.png', '#8B0000', 23),
('Belts', 'belts', '/images/category-placeholder.png', '#000000', 24),
('Sunglasses', 'sunglasses', '/images/category-placeholder.png', '#4B0082', 25),
('Caps', 'caps', '/images/category-placeholder.png', '#483D8B', 26),
('New Arrivals', 'new-arrivals', '/images/category-placeholder.png', '#FFD700', 27),
('Best Sellers', 'best-sellers', '/images/category-placeholder.png', '#FFA500', 28),
('Clearance Sale', 'clearance-sale', '/images/category-placeholder.png', '#DC143C', 29)
ON CONFLICT (slug) DO UPDATE 
SET image_url = EXCLUDED.image_url, bg_color = EXCLUDED.bg_color, priority = EXCLUDED.priority;
