const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("=== FETCHING ALL PRODUCTS FROM SUPABASE ===");
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }

  console.log(`Total products found: ${products.length}`);
  
  products.forEach((p, idx) => {
    console.log(`\nProduct [${idx + 1}] ID: ${p.id}`);
    console.log(`  Name: ${p.name}`);
    console.log(`  Slug: ${p.slug}`);
    console.log(`  Category: ${p.category}`);
    console.log(`  Collection: ${p.collection}`);
    console.log(`  Brand: ${p.brand}`);
    console.log(`  Selling Price: ${p.selling_price}, MRP: ${p.mrp}`);
    console.log(`  Images (${p.images ? p.images.length : 0}):`, p.images);
    console.log(`  Image Colors:`, p.image_colors);
    console.log(`  Sizes:`, p.sizes);
    console.log(`  Overall Stock:`, p.overall_stock);
    console.log(`  Featured: ${p.featured}, Trending: ${p.trending}, New Arrival: ${p.new_arrival}, Deal of Day: ${p.deal_of_day}`);
  });
  
  process.exit(0);
}

run();
