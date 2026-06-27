require('dotenv').config({ path: '.env.local' });
const { SupabaseProductRepository } = require('./lib/repositories/supabaseProvider');
const { productService } = require('./services/productService');

async function testUpdate() {
  const repo = new SupabaseProductRepository();
  const prods = await repo.getAll();
  const p = prods[0];
  console.log('Testing update on product:', p.slug);
  
  const updates = {
    ...p,
    imageColors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Red', display_order: 1 }
    ]
  };
  
  await repo.update(p.id, updates);
  
  const afterUpdate = await repo.getBySlug(p.slug);
  console.log('After update:', JSON.stringify(afterUpdate.imageColors, null, 2));
}

testUpdate().catch(console.error);
