const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function verifyOrderImages() {
  console.log('Fetching orders with products...');
  const { data, error } = await sb
    .from('orders')
    .select('*, order_items(*, products(id, name, images, slug))')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching orders:', error);
    process.exit(1);
  }

  console.log(`Successfully fetched orders! Total retrieved: ${data.length}`);
  for (const order of data) {
    console.log(`\nOrder #${order.order_number} (${order.id}):`);
    const items = order.order_items || [];
    for (const item of items) {
      const prod = item.products;
      const image = prod?.images?.[0] || item.image;
      console.log(`  - Product: ${item.product_name}`);
      console.log(`    Color: ${item.color}, Size: ${item.size}, Qty: ${item.quantity}, Price: ₹${item.price}`);
      console.log(`    Product Image URL: ${image || 'MISSING (will show placeholder icon)'}`);
    }
  }
}

verifyOrderImages();
