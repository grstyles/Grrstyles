require('dotenv').config({ path: '.env.local' });

async function run() {
  const { createClient } = require('@supabase/supabase-js');
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url.endsWith('/rest/v1/')) {
    url = url.slice(0, -9);
  }

  const supabase = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const mapped = {
    name: 'Test Product',
    slug: 'test-product-colors',
    category: 'Shirts',
    images: ['/img1.jpg', '/img2.jpg'],
    color: 'White',
    image_colors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Red', display_order: 1 }
    ]
  };

  const { data, error } = await supabase
    .from('products')
    .insert(mapped)
    .select('*')
    .single();

  console.log('Insert Result:', data, 'Error:', error);
}

run().catch(console.error);
