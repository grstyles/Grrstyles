const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';
let serviceKey = '';

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
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);
const serviceSupabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const testEmail = `testuser${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';

  console.log('Creating test user via admin api...');
  const { data: userData, error: createError } = await serviceSupabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (createError) {
    console.error('Create user error:', createError);
    return;
  }

  const user = userData.user;
  console.log('User created with ID:', user.id);

  // Now sign in as user with anon client
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    await serviceSupabase.auth.admin.deleteUser(user.id);
    return;
  }

  console.log('Signed in as user successfully!');

  // Check/Create cart
  console.log('Upserting cart for user:', user.id);
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select('id')
    .single();

  console.log('Cart result:', { cartData, cartError });

  if (!cartData) {
    await serviceSupabase.auth.admin.deleteUser(user.id);
    return;
  }

  // Get a product ID from DB
  const { data: prods, error: prodError } = await supabase.from('products').select('id').limit(1);
  if (prodError || !prods || prods.length === 0) {
    console.error('No products found in DB:', prodError);
    await serviceSupabase.auth.admin.deleteUser(user.id);
    return;
  }
  const prodId = prods[0].id;
  console.log('Found product ID:', prodId);

  // Insert into cart_items
  console.log('Attempting to insert into cart_items...');
  const { data: itemData, error: itemError } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartData.id,
      product_id: prodId,
      size: 'M',
      shirt_size: '',
      pant_size: '',
      shoe_size: '',
      quantity: 1,
      custom_images: [],
      updated_at: new Date().toISOString(),
    })
    .select();

  console.log('Insert cart item result:', { itemData, itemError });

  // Cleanup test user
  if (user?.id) {
    await serviceSupabase.auth.admin.deleteUser(user.id);
    console.log('Test user cleaned up.');
  }
}

test().catch(console.error);
