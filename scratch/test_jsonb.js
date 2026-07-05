require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing Supabase Mapping...');
  // Find a product
  const { data: prods } = await supabase.from('products').select('*').limit(1);
  if (!prods || prods.length === 0) return console.log('No products found');
  
  const p = prods[0];
  console.log('Original DB shirt_stock:', p.shirt_stock, typeof p.shirt_stock);
  
  // Try to update it
  const { data: updated, error } = await supabase.from('products').update({
    shirt_stock: { 'M': 50, 'L': 20 }
  }).eq('id', p.id).select('*').single();
  
  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('Updated DB shirt_stock:', updated.shirt_stock, typeof updated.shirt_stock);
  }
}
test();
