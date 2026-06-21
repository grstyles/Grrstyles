const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
    }
  });
}

const cleanedUrl = (supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(cleanedUrl, supabaseKey);

const columnsToTest = [
  'id',
  'product_id',
  'sku',
  'name',
  'slug',
  'category',
  'collection',
  'color',
  'images',
  'sizes',
  'mrp_price',
  'selling_price',
  'discount_percent',
  'label',
  'description',
  'featured',
  'trending',
  'new_arrival',
  'deal_of_the_day',
  'brand',
  'rating',
  'reviews_count',
  'created_at'
];

async function testColumns() {
  console.log('Probing individual columns in "products" table...');
  for (const col of columnsToTest) {
    const { data, error } = await supabase.from('products').select(col).limit(1);
    if (error) {
      console.log(`- Column "${col}": FAILED (${error.message})`);
    } else {
      console.log(`- Column "${col}": OK`);
    }
  }
}

testColumns().catch(console.error);
