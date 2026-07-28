const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("=== COUPONS ===");
  const { data: coupons, error: err1 } = await supabase.from('coupons').select('*, product_coupons(*)');
  console.log(JSON.stringify({ coupons, err1 }, null, 2));

  console.log("=== PRODUCT_COUPONS ===");
  const { data: pc, error: err2 } = await supabase.from('product_coupons').select('*');
  console.log(JSON.stringify({ pc, err2 }, null, 2));
}

run();
