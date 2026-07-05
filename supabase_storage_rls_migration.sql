-- Supabase Storage Bucket and RLS Migration
-- Run this in the Supabase Dashboard SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to the bucket
CREATE POLICY "Public Read Access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');

-- 3. Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-images');

-- 4. Allow authenticated users to update (UPDATE)
CREATE POLICY "Authenticated users can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'category-images');

-- 5. Allow authenticated users to delete (DELETE)
CREATE POLICY "Authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'category-images');

-- If you have existing policies that conflict, you can drop them first:
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
-- DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
