require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''), 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }
  console.log('Logged in as admin.');

  const editingId = '41d1fc06-b6cf-4aa7-a813-b0dd766f3b8d';
  
  const mapped = {
    image_colors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Black', display_order: 1 }
    ]
  };

  const { data, error } = await supabase
    .from('products')
    .update(mapped)
    .eq('id', editingId)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Updated db image_colors:', JSON.stringify(data.image_colors));
  }
}

run().catch(console.error);
