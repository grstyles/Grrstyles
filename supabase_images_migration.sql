-- =========================================================================
-- GR STYLES - PRODUCT IMAGES COLOR MAPPING MIGRATION SCRIPT
-- =========================================================================

-- 1. Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  color_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_color_name ON public.product_images(color_name);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access for product images" ON public.product_images;
CREATE POLICY "Allow public read access for product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated admin write access for product images" ON public.product_images;
CREATE POLICY "Allow authenticated admin write access for product images"
  ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Automatically migrate existing products' images
INSERT INTO public.product_images (product_id, image_url, color_name, display_order)
SELECT 
  p.id, 
  img.image_url, 
  COALESCE(NULLIF(p.color, ''), 'Original'), 
  img.idx - 1
FROM 
  public.products p,
  unnest(p.images) WITH ORDINALITY AS img(image_url, idx)
ON CONFLICT DO NOTHING;
