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

async function testInsert() {
  const mockProduct = {
    name: 'SUPABASE TEST PRODUCT',
    slug: 'supabase-test-product',
    category: 'Shirts',
    collection: 'Trending Collections',
    color: 'Black',
    images: ['https://placehold.co/600x800'],
    sizes: [{ size: 'M', stock: 10 }],
    mrpPrice: 1200,
    sellingPrice: 999,
    discountPercent: 17,
    label: 'HOT',
    description: 'This is a test product inserted from scratch script to verify why Supabase products table remains empty.',
    isNew: true,
    bestSeller: true,
    metadata: {
      dealOfDay: true,
      featured: true
    }
  };

  // 1. Attempt insert without SKU (same as SupabaseProductRepository)
  console.log('Inserting WITHOUT SKU (simulating SupabaseProductRepository)...');
  const mappedWithoutSku = {
    name: mockProduct.name,
    slug: mockProduct.slug,
    category: mockProduct.category,
    collection: mockProduct.collection,
    color: mockProduct.color,
    images: mockProduct.images,
    sizes: mockProduct.sizes,
    mrp_price: mockProduct.mrpPrice,
    selling_price: mockProduct.sellingPrice,
    discount_percent: mockProduct.discountPercent,
    label: mockProduct.label,
    description: mockProduct.description,
    brand: 'GR STYLES',
    new_arrival: mockProduct.isNew,
    trending: mockProduct.bestSeller,
    deal_of_the_day: mockProduct.metadata.dealOfDay,
    featured: mockProduct.metadata.featured,
  };

  const { data: data1, error: error1 } = await supabase
    .from('products')
    .insert(mappedWithoutSku)
    .select('*')
    .maybeSingle();

  if (error1) {
    console.error('Insert WITHOUT SKU failed. Error:', error1.message || error1);
  } else {
    console.log('Insert WITHOUT SKU succeeded:', data1);
  }

  // 2. Attempt insert with SKU
  console.log('\nInserting WITH SKU...');
  const mappedWithSku = {
    ...mappedWithoutSku,
    sku: `GR-SH-TEST-${Date.now().toString().slice(-4)}`
  };

  const { data: data2, error: error2 } = await supabase
    .from('products')
    .insert(mappedWithSku)
    .select('*')
    .maybeSingle();

  if (error2) {
    console.error('Insert WITH SKU failed. Error:', error2.message || error2);
  } else {
    console.log('Insert WITH SKU succeeded:', data2);
    
    // Clean up test product
    console.log('\nCleaning up inserted test product...');
    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .eq('id', data2.id);
    if (delErr) {
      console.error('Cleanup failed:', delErr.message);
    } else {
      console.log('Cleanup succeeded.');
    }
  }
}

testInsert().catch(console.error);
