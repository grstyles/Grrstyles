const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey);
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function runTests() {
  console.log('====================================================');
  console.log('GR STYLES - SECURITY & APPLICATION VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '-> ' + details : ''}`);
    }
  }

  // TEST 1: Public Storefront Reads (Must Succeed for Anon)
  console.log('--- 1. Testing Public Storefront Read Access (Anon) ---');
  
  const publicTables = [
    'products',
    'categories',
    'collections',
    'coupons',
    'product_coupons',
    'product_images',
    'banners',
    'category_carousel',
    'shipping_settings'
  ];

  for (const table of publicTables) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      assert(!error, `Anon can read public table "${table}"`, error?.message);
    } catch (e) {
      assert(false, `Anon can read public table "${table}"`, e.message);
    }
  }

  // TEST 2: Anonymous Mutation Rejection (Must Fail / Denied by RLS)
  console.log('\n--- 2. Testing Anonymous Mutation Blocking (Anon) ---');

  // Attempt unauthorized insert into products
  const { data: pInsert, error: pInsertErr } = await anonClient
    .from('products')
    .insert([{
      sku: 'MALICIOUS_TEST_SKU_' + Date.now(),
      name: 'Hacked Product',
      slug: 'hacked-product-' + Date.now(),
      category: 'shirts',
      color: 'Black',
      description: 'Hacked description',
      mrp_price: 100,
      selling_price: 50
    }]);
  assert(pInsertErr !== null, 'Anon CANNOT insert products (RLS rejects write)', pInsertErr?.message);

  // Attempt unauthorized insert into coupons
  const { data: cInsert, error: cInsertErr } = await anonClient
    .from('coupons')
    .insert([{
      code: 'HACK99_' + Date.now(),
      discount_percent: 99,
      discount_value: 99,
      is_active: true
    }]);
  assert(cInsertErr !== null, 'Anon CANNOT insert coupons (RLS rejects write)', cInsertErr?.message);

  // Attempt unauthorized insert into category_carousel
  const { data: carInsert, error: carInsertErr } = await anonClient
    .from('category_carousel')
    .insert([{
      title: 'Hacked Category',
      slug: 'hacked-cat-' + Date.now(),
      bg_color: '#000000'
    }]);
  assert(carInsertErr !== null, 'Anon CANNOT insert category_carousel (RLS rejects write)', carInsertErr?.message);

  // TEST 3: Sensitive Data Isolation (Anon cannot read private profiles or orders)
  console.log('\n--- 3. Testing Sensitive Data Protection (Anon) ---');

  const { data: anonProfiles, error: anonProfErr } = await anonClient.from('profiles').select('*');
  const profCount = anonProfiles ? anonProfiles.length : 0;
  assert(profCount === 0 || anonProfErr !== null, 'Anon CANNOT view customer profiles (Returns 0 rows or error)', `Found ${profCount} rows`);

  const { data: anonOrders, error: anonOrderErr } = await anonClient.from('orders').select('*');
  const orderCount = anonOrders ? anonOrders.length : 0;
  assert(orderCount === 0 || anonOrderErr !== null, 'Anon CANNOT view customer orders (Returns 0 rows or error)', `Found ${orderCount} rows`);

  const { data: anonAddrs, error: anonAddrErr } = await anonClient.from('user_addresses').select('*');
  const addrCount = anonAddrs ? anonAddrs.length : 0;
  assert(addrCount === 0 || anonAddrErr !== null, 'Anon CANNOT view user addresses (Returns 0 rows or error)', `Found ${addrCount} rows`);

  const { data: anonAdmins, error: anonAdminErr } = await anonClient.from('admins').select('*');
  const adminRows = anonAdmins ? anonAdmins.length : 0;
  assert(adminRows === 0 || anonAdminErr !== null, 'Anon CANNOT view admins table (Returns 0 rows or error)', `Found ${adminRows} rows`);

  // TEST 4: Backend / Service Role & Admin Access
  if (adminClient) {
    console.log('\n--- 4. Testing Service Role & Admin Access ---');
    
    const { data: admOrders, error: admOrderErr } = await adminClient.from('orders').select('id, order_number');
    assert(!admOrderErr && admOrders !== null, 'Admin / Service Role can read orders', admOrderErr?.message);

    const { data: admProfs, error: admProfErr } = await adminClient.from('profiles').select('id, email, role');
    assert(!admProfErr && admProfs !== null, 'Admin / Service Role can read profiles', admProfErr?.message);

    const { data: admProducts, error: admProdErr } = await adminClient.from('products').select('id, name');
    assert(!admProdErr && admProducts !== null, 'Admin / Service Role can read products', admProdErr?.message);
  }

  // TEST 5: Atomic Stock Reduction RPC & Helper Functions
  console.log('\n--- 5. Testing Database Functions (RPC) ---');

  const testClient = adminClient || anonClient;

  // Test is_admin RPC
  const { data: isAdminRes, error: isAdminErr } = await testClient.rpc('is_admin');
  assert(!isAdminErr, 'RPC public.is_admin() executes cleanly', isAdminErr?.message);

  // Test reduce_stock RPC with a non-existent UUID (should handle gracefully and return true/false without unhandled SQL error)
  const { data: reduceRes, error: reduceErr } = await testClient.rpc('reduce_stock', {
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_size: 'M',
    p_quantity: 0,
    p_category: 'shirts'
  });
  assert(!reduceErr, 'RPC public.reduce_stock() executes cleanly and handles edge-cases', reduceErr?.message);

  // TEST 6: Application Storefront Catalog & Settings Data
  console.log('\n--- 6. Storefront Catalog Integrity ---');
  const { data: storeProducts, error: spErr } = await anonClient.from('products').select('id, name, slug, selling_price, overall_stock');
  assert(!spErr && storeProducts && storeProducts.length > 0, `Storefront products available (${storeProducts?.length || 0} products found)`, spErr?.message);

  const { data: storeCarousel, error: scErr } = await anonClient.from('category_carousel').select('id, title, slug, enabled');
  assert(!scErr && storeCarousel && storeCarousel.length > 0, `Storefront category carousel available (${storeCarousel?.length || 0} items found)`, scErr?.message);

  const { data: storeShipping, error: ssErr } = await anonClient.from('shipping_settings').select('*');
  assert(!ssErr && storeShipping && storeShipping.length > 0, `Storefront shipping settings available`, ssErr?.message);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
