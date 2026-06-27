require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''), 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const editingId = 'd13da790-1eee-4157-acc9-faf0f72f9035';
  
  const mapped = {
    image_colors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Black', display_order: 1 }
    ]
  };

  console.log('Sending mapped image_colors:', JSON.stringify(mapped.image_colors));

  const { data, error } = await supabase
    .from('products')
    .update(mapped)
    .eq('id', editingId)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Updated db image_colors:', JSON.stringify(data.image_colors));
  }
}

run().catch(console.error);
