const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error fetching products sample:', error);
  } else if (data && data.length > 0) {
    console.log('Products columns:', Object.keys(data[0]));
    console.log('Sample product:', data[0]);
  } else {
    console.log('No products found or table empty.');
  }
}

checkSchema();
