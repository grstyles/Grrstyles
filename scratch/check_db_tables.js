require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check(table) {
  const { error } = await supabase.from(table).select('id').limit(1);
  if (error && error.message.includes('Could not find')) {
    console.log(`❌ ${table} DOES NOT EXIST`);
  } else if (error) {
    console.log(`⚠ ${table} Exists but RLS/Error: ${error.message}`);
  } else {
    console.log(`✅ ${table} Exists`);
  }
}

async function run() {
  const tables = ['products', 'orders', 'profiles', 'user_addresses', 'category_carousel', 'wishlist', 'cart', 'marketing_config', 'coupons', 'banners', 'product_coupons'];
  for (const t of tables) await check(t);
}
run();
