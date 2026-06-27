-- Create product_images table for Dynamic Product Image Color Mapping
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  color_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on product_images" 
ON product_images FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated insert on product_images" 
ON product_images FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on product_images" 
ON product_images FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete on product_images" 
ON product_images FOR DELETE 
TO authenticated 
USING (true);
