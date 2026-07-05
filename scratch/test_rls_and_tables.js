require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  console.log(`Checking table: ${tableName}`);
  
  // Test Read (should work for products, marketing, categories - others depend on RLS)
  const { data, error: readError } = await supabase.from(tableName).select('*').limit(1);
  if (readError) {
    console.log(`  Read Error (RLS blocked?):`, readError.message);
  } else {
    console.log(`  Read Success: Found ${data.length} records.`);
  }

  // Test Write (should fail for products, marketing, categories if RLS is strict, or work if allowed)
  const mockId = 'test-id-' + Math.random().toString(36).substring(7);
  const { error: writeError } = await supabase.from(tableName).insert({ id: mockId, title: 'test', user_id: 'test-user' }).select();
  
  if (writeError) {
    console.log(`  Write Error (RLS blocked?):`, writeError.message);
  } else {
    console.log(`  Write Success (WARNING: RLS is open for ${tableName})`);
    // Cleanup
    await supabase.from(tableName).delete().eq('id', mockId);
  }
}

async function run() {
  const tables = ['products', 'orders', 'users', 'wishlist', 'cart', 'marketing', 'category_carousel', 'inventory'];
  for (const table of tables) {
    await checkTable(table);
  }
}

run();
