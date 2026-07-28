const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("Removing product restrictions for WELCOME100...");
  const { data, error } = await supabase
    .from('product_coupons')
    .delete()
    .eq('coupon_code', 'WELCOME100');

  if (error) {
    console.error("Error clearing product_coupons:", error);
  } else {
    console.log("Successfully removed product restrictions for WELCOME100! WELCOME100 is now storewide for ALL products.");
  }
}

run();
