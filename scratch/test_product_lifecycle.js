const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';
let adminEmail = '';
let adminPassword = '';

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
      if (key === 'NEXT_PUBLIC_ADMIN_EMAIL') adminEmail = value;
      if (key === 'ADMIN_PASSWORD') adminPassword = value;
    }
  });
}

if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLifecycle() {
  try {
    console.log('0. Signing in as Admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (authError) {
      console.error('FAIL: Admin Sign In failed!', authError);
      process.exit(1);
    }
    console.log('SUCCESS: Admin signed in successfully!', { userEmail: authData.user.email });

    const testProduct = {
      sku: `GR-TEST-${Date.now().toString().slice(-4)}`,
      name: 'TEST VERIFICATION SHIRT',
      slug: `test-verification-shirt-${Date.now()}`,
      category: 'shirts',
      collection: 'trending-collections',
      images: ['https://example.com/image.png'],
      sizes: [{ size: 'M', stock: 10 }, { size: 'L', stock: 5 }],
      stock: 15,
      mrp: 1499.00,
      selling_price: 999.00,
      description: 'A test product created during Supabase Only validation.',
      brand: 'GR STYLES',
      new_arrival: true,
      trending: true,
      deal_of_day: false,
      featured: false
    };

    console.log('\n1. Attempting database insert into products...');
    const { data: createdData, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select('*')
      .single();

    if (createError) {
      console.error('FAIL: Product insertion failed!');
      console.error('Supabase Error details:', createError);
      process.exit(1);
    }

    console.log('SUCCESS: Product inserted successfully!');
    console.log('Exact Supabase insert response:', JSON.stringify(createdData, null, 2));

    const productId = createdData.id;

    console.log('\n2. Attempting to fetch inserted product by ID...');
    const { data: fetchedData, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !fetchedData) {
      console.error('FAIL: Fetching product failed!', fetchError);
      process.exit(1);
    }

    console.log('SUCCESS: Product exists in database after fetch!', { id: fetchedData.id, name: fetchedData.name });

    console.log('\n3. Cleaning up: Deleting test product...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('WARNING: Cleanup deletion failed!', deleteError);
    } else {
      console.log('SUCCESS: Test product deleted and database cleaned.');
    }
  } catch (e) {
    console.error('Unexpected error in test:', e);
  }
}

testLifecycle().catch(console.error);
