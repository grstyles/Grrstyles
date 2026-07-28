const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
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
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('Testing inserting row with new columns into coupons...');
  const testCoupon = {
    code: 'TEST_ENGINE_' + Date.now(),
    name: 'Engine Test',
    description: 'Test coupon for dual engine',
    discount_type: 'fixed',
    discount_value: 150,
    minimum_purchase: 1000,
    max_cart_value: 5000,
    maximum_discount: 150,
    is_active: true,
    active: true,
    used_count: 0
  };

  const { data, error } = await supabase.from('coupons').insert(testCoupon).select();
  if (error) {
    console.error('Error inserting test coupon:', error);
  } else {
    console.log('🎉 Successfully inserted test coupon with new columns!', data);
    // Delete test row
    await supabase.from('coupons').delete().eq('code', testCoupon.code);
    console.log('Cleaned up test row.');
  }
}

run().catch(console.error);
