require('dotenv').config({ path: '.env.local' });
const { SupabaseProductRepository } = require('./lib/repositories/supabaseProvider');

async function run() {
  const repo = new SupabaseProductRepository();
  const productPayload = {
    name: 'Oxford Premium Shirts',
    slug: 'oxford-premium-shirts',
    category: 'Shirts',
    images: ['/img1.jpg', '/img2.jpg'],
    color: 'White',
    imageColors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Black', display_order: 1 }
    ]
  };

  const prods = await repo.getBySlug('oxford-premium-shirts');
  console.log('Before update DB id:', prods.id);

  const updated = await repo.update(prods.id, productPayload);
  console.log('Updated product image_colors from update response:', JSON.stringify(updated.imageColors, null, 2));
  
  const fetched = await repo.getBySlug('oxford-premium-shirts');
  console.log('Fetched product imageColors:', JSON.stringify(fetched.imageColors, null, 2));
}

run().catch(console.error);
