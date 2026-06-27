require('dotenv').config({ path: '.env.local' });
const { SupabaseProductRepository } = require('../lib/repositories/supabaseProvider.ts');

async function run() {
  const repo = new SupabaseProductRepository();
  
  // 1. Fetch products
  const products = await repo.getAll();
  const firstProd = products[0];
  console.log('Testing with product:', firstProd.slug, firstProd.id);

  const productPayload = {
    ...firstProd,
    imageColors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Black', display_order: 1 }
    ]
  };

  const updated = await repo.update(firstProd.id, productPayload);
  console.log('Updated product image_colors from update response:', JSON.stringify(updated.imageColors, null, 2));
  
  const fetched = await repo.getBySlug(firstProd.slug);
  console.log('Fetched product imageColors:', JSON.stringify(fetched.imageColors, null, 2));
}

run().catch(console.error);
