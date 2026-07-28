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
  console.log('Testing Supabase JS Client access to coupons table...');
  const { data: sample, error } = await supabase.from('coupons').select('*').limit(1);
  if (error) {
    console.error('Error selecting coupons:', error);
    return;
  }
  console.log('Current coupon columns:', sample.length > 0 ? Object.keys(sample[0]) : 'empty table');

  // Test updating a dummy column or inserting sample
  const testData = {
    code: 'TEST_INIT_' + Date.now(),
    description: 'Test coupon',
    discount_type: 'fixed',
    discount_value: 100,
    minimum_purchase: 500,
    max_cart_value: 2000,
    maximum_discount: 500,
    is_active: true
  };

  const { data: insData, error: insErr } = await supabase.from('coupons').insert(testData).select();
  if (insErr) {
    console.log('Insert test result error:', insErr.message);
    if (insErr.message.includes('column') || insErr.code === 'PGRST204') {
      console.log('Some columns might not exist yet in schema cache or table definition.');
    }
  } else {
    console.log('Successfully inserted test row into coupons:', insData[0]);
    // Clean up test row
    await supabase.from('coupons').delete().eq('code', testData.code);
  }
}

run().catch(console.error);
