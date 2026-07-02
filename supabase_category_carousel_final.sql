-- SQL Migration for Category Carousel Redesign
-- Final Production Ready Schema

-- 1. Create the category_carousel table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_carousel ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Access on category_carousel" 
ON public.category_carousel FOR SELECT USING (true);

-- Allow authenticated admins to insert/update/delete
CREATE POLICY "Admin Insert Access on category_carousel" 
ON public.category_carousel FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin Update Access on category_carousel" 
ON public.category_carousel FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Delete Access on category_carousel" 
ON public.category_carousel FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_carousel_slug ON public.category_carousel(slug);
CREATE INDEX IF NOT EXISTS idx_category_carousel_priority ON public.category_carousel(priority);
CREATE INDEX IF NOT EXISTS idx_category_carousel_enabled ON public.category_carousel(enabled);
CREATE INDEX IF NOT EXISTS idx_category_carousel_featured ON public.category_carousel(featured);

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_category_carousel_modtime ON public.category_carousel;
CREATE TRIGGER update_category_carousel_modtime
    BEFORE UPDATE ON public.category_carousel
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 3. Create the category-images Storage Bucket
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

-- 4. Seed Default Categories
INSERT INTO public.category_carousel (title, slug, image_url, bg_color, priority, featured, redirect_link) VALUES 
('Shirts', 'shirts', '/images/category-placeholder.png', '#F5F5DC', 0, true, null),
('Oxford Shirts', 'oxford-shirts', '/images/category-placeholder.png', '#F0E68C', 1, true, null),
('Printed Shirts', 'printed-shirts', '/images/category-placeholder.png', '#F8DE7E', 2, true, null),
('Oversized T-Shirts', 'oversized-tshirts', '/images/category-placeholder.png', '#FFFDD0', 3, true, null),
('Polo T-Shirts', 'polo-tshirts', '/images/category-placeholder.png', '#808000', 4, true, null),
('Formal Shirts', 'formal-shirts', '/images/category-placeholder.png', '#BDB76B', 5, false, null),
('Baggy Shirts', 'baggy-shirts', '/images/category-placeholder.png', '#EEE8AA', 6, false, null),
('Korean Shirts', 'korean-shirts', '/images/category-placeholder.png', '#DAA520', 7, false, null),
('Trousers', 'trousers', '/images/category-placeholder.png', '#C2B280', 8, false, null),
('Formal Pants', 'formal-pants', '/images/category-placeholder.png', '#B8860B', 9, false, null),
('Cargo Pants', 'cargo-pants', '/images/category-placeholder.png', '#B5651D', 10, false, null),
('Baggy Pants', 'baggy-pants', '/images/category-placeholder.png', '#D2691E', 11, false, null),
('Jeans', 'jeans', '/images/category-placeholder.png', '#1560BD', 12, false, null),
('Baggy Jeans', 'baggy-jeans', '/images/category-placeholder.png', '#4682B4', 13, false, null),
('Jackets', 'jackets', '/images/category-placeholder.png', '#A9A9A9', 14, false, null),
('Hoodies', 'hoodies', '/images/category-placeholder.png', '#808080', 15, false, null),
('Sweatshirts', 'sweatshirts', '/images/category-placeholder.png', '#696969', 16, false, null),
('Co-Ord Sets', 'co-ord-sets', '/images/category-placeholder.png', '#556B2F', 17, false, null),
('Accessories', 'accessories', '/images/category-placeholder.png', '#FFFFF0', 18, false, null),
('Shoes', 'shoes', '/images/category-placeholder.png', '#36454F', 19, false, null),
('Traditional Wear', 'traditional', '/images/category-placeholder.png', '#FFDB58', 20, false, null),
('Festival Collection', 'festival', '/images/category-placeholder.png', '#FFD700', 21, false, null),
('New Arrivals', 'new-arrivals', '/images/category-placeholder.png', '#FFD700', 22, false, '/new-in'),
('Best Sellers', 'best-sellers', '/images/category-placeholder.png', '#FFA500', 23, false, '/best-sellers'),
('Clearance Sale', 'clearance-sale', '/images/category-placeholder.png', '#DC143C', 24, false, '/clearance')
ON CONFLICT (slug) DO NOTHING;

-- Note: In Supabase, you must notify PostgREST to reload its schema cache if you run this script directly in PostgreSQL.
NOTIFY pgrst, 'reload schema';
