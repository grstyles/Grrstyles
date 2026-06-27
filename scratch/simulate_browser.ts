require('dotenv').config({ path: '.env.local' });
const { SupabaseProductRepository } = require('../lib/repositories/supabaseProvider.ts');

async function simulateBrowser() {
  const repo = new SupabaseProductRepository();
  const editingId = 'd13da790-1eee-4157-acc9-faf0f72f9035'; // oxford premium shirts

  // 1. imageColors React state before Save
  const imageColorsState = ['White', 'Black', 'Blue'];
  const imagesList = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];
  const color = 'White';
  
  console.log('1. imageColors React state before Save:', JSON.stringify(imageColorsState, null, 2));

  // 2. buildProductPayload
  const buildProductPayload = (id) => {
    return {
      id,
      productId: id,
      name: 'Oxford Premium Shirts',
      slug: 'oxford-premium-shirts',
      category: 'Shirts',
      images: imagesList,
      color: color || imageColorsState[0] || '',
      imageColors: imagesList.map((img, idx) => ({
        image_url: img,
        color_name: imageColorsState[idx] || color || 'Original',
        display_order: idx
      }))
    };
  };

  const productPayload = buildProductPayload(editingId);
  console.log('2. buildProductPayload():', JSON.stringify(productPayload.imageColors, null, 2));

  // 3. Payload sent to updateProduct()
  console.log('3. Payload sent to createProduct()/updateProduct():', JSON.stringify(productPayload.imageColors, null, 2));

  // Now, simulate the repository layer
  const mapped = {};
  if (productPayload.name) mapped.name = productPayload.name;
  if (productPayload.images) mapped.images = productPayload.images;
  if (productPayload.imageColors) mapped.image_colors = productPayload.imageColors; // wait, no! The code says `if ((updates as any).imageColors)`

  console.log('4. Payload sent to Supabase:', JSON.stringify(mapped.image_colors, null, 2));

  // 5. Database row immediately after update
  // Instead of updating, just fetch the current row and see if the mapped matches
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('products')
    .update(mapped)
    .eq('id', editingId)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('5. Database row immediately after update:', JSON.stringify(data.image_colors, null, 2));
  }
}

simulateBrowser().catch(console.error);
