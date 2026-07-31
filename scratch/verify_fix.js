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

async function verify() {
  const testEmail = `verifyfix_${Date.now()}@gmail.com`;
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
  console.log('Created user auth ID:', user.id);

  // Create profile with different ID to simulate email matching an existing profile
  const differentProfileId = '11111111-2222-3333-4444-555555555555';
  await serviceSupabase.from('profiles').insert({
    id: differentProfileId,
    email: testEmail,
    full_name: 'Existing User Profile',
    role: 'customer'
  });
  console.log('Inserted profile with different ID:', differentProfileId);

  // Now sign in as user
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    await serviceSupabase.from('profiles').delete().eq('id', differentProfileId);
    await serviceSupabase.auth.admin.deleteUser(user.id);
    return;
  }

  const sessionUserId = sessionData.session.user.id;
  console.log('Session auth.uid():', sessionUserId);

  // Test getOrCreateCartId with sessionUserId
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .upsert({ user_id: sessionUserId }, { onConflict: 'user_id' })
    .select('id')
    .single();

  console.log('Cart creation result:', { cartData, cartError });

  // Test product fetch
  const { data: prods } = await supabase.from('products').select('id').limit(1);
  const prodId = prods[0].id;

  // Insert into cart_items
  const { data: itemData, error: itemError } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartData.id,
      product_id: prodId,
      size: 'L',
      quantity: 2
    })
    .select();

  console.log('Insert cart item result:', { itemData, itemError });

  // Cleanup
  await serviceSupabase.from('cart_items').delete().eq('cart_id', cartData.id);
  await serviceSupabase.from('carts').delete().eq('id', cartData.id);
  await serviceSupabase.from('profiles').delete().eq('id', differentProfileId);
  await serviceSupabase.auth.admin.deleteUser(user.id);
  console.log('Cleaned up successfully! Everything working!');
}

verify().catch(console.error);
