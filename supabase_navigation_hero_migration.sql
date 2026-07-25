-- SQL Migration for Navigation Menu Hero Images
-- Run this script in your Supabase Dashboard SQL Editor

-- 1. Create the navigation_hero_images table
CREATE TABLE IF NOT EXISTS public.navigation_hero_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT UNIQUE NOT NULL,
    page_name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.navigation_hero_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access on navigation_hero_images" ON public.navigation_hero_images;
DROP POLICY IF EXISTS "Authenticated insert on navigation_hero_images" ON public.navigation_hero_images;
DROP POLICY IF EXISTS "Authenticated update on navigation_hero_images" ON public.navigation_hero_images;
DROP POLICY IF EXISTS "Authenticated delete on navigation_hero_images" ON public.navigation_hero_images;

-- Allow public read access
CREATE POLICY "Public read access on navigation_hero_images"
ON public.navigation_hero_images FOR SELECT USING (true);

-- Allow authenticated users (admins) to insert/update/delete
CREATE POLICY "Authenticated insert on navigation_hero_images"
ON public.navigation_hero_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update on navigation_hero_images"
ON public.navigation_hero_images FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete on navigation_hero_images"
ON public.navigation_hero_images FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Create Storage Bucket for navigation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('navigation-images', 'navigation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public access on navigation-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload on navigation-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update on navigation-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete on navigation-images" ON storage.objects;

CREATE POLICY "Public access on navigation-images"
ON storage.objects FOR SELECT USING (bucket_id = 'navigation-images');

CREATE POLICY "Admin upload on navigation-images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'navigation-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin update on navigation-images"
ON storage.objects FOR UPDATE USING (bucket_id = 'navigation-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin delete on navigation-images"
ON storage.objects FOR DELETE USING (bucket_id = 'navigation-images' AND auth.role() = 'authenticated');

-- 3. Seed initial default entries
INSERT INTO public.navigation_hero_images (page_key, page_name, image_url) VALUES
('new-in', 'New In', '/images/image1.jpeg'),
('mens', 'Mens', '/images/banners/banner-1.jpg'),
('collections', 'Collections', '/images/banners/banner-2.jpg'),
('sale', 'Sale', 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2000&auto=format&fit=crop')
ON CONFLICT (page_key) DO NOTHING;
