const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('product_images').select('*').limit(1);
  if (error) {
    console.error('Error fetching product_images:', error);
  } else {
    console.log('Columns in product_images:', data.length ? Object.keys(data[0]) : 'Table is empty, schema unknown here');
    if (data.length) console.log('Sample row:', data[0]);
  }
}
main();
