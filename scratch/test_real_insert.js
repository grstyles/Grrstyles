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

async function testRealInsert() {
  const testProduct = {
    sku: `GR-SH-TEST-${Date.now().toString().slice(-4)}`,
    name: 'SUPABASE TEST PRODUCT',
    slug: `supabase-test-product-${Date.now().toString().slice(-4)}`,
    category: 'Shirts',
    collection: 'Trending Collections',
    brand: 'GR STYLES',
    description: 'This is a test product inserted with real database columns.',
    mrp: 1299,
    selling_price: 999,
    images: ['https://placehold.co/600x800'],
    sizes: [{ size: 'M', stock: 10 }],
    stock: 10,
    featured: true,
    trending: true,
    deal_of_day: true,
    new_arrival: true
  };

  console.log('Inserting with exact database columns...');
  const { data, error } = await supabase
    .from('products')
    .insert(testProduct)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Insert failed:', error.message || error);
  } else {
    console.log('Insert succeeded! Product data:', data);
    
    console.log('\nCleaning up...');
    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .eq('id', data.id);
    if (delErr) {
      console.error('Delete failed:', delErr.message);
    } else {
      console.log('Cleanup succeeded.');
    }
  }
}

testRealInsert().catch(console.error);
