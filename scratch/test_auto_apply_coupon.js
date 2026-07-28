const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("=== TESTING AUTO-APPLY COUPON LOGIC ===");

  const subtotal = 1500;
  const productIds = ['ae631159-1dbf-4fb4-b3bc-79e64dac312b'];

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*, product_coupons(product_id)')
    .eq('active', true);

  console.log("Active coupons in DB:", coupons);

  const now = new Date();
  const eligible = [];

  for (const c of coupons || []) {
    if (c.start_date && new Date(c.start_date) > now) continue;
    if (c.expiry_date && new Date(c.expiry_date) < now) continue;
    if (c.usage_limit && c.used_count >= c.usage_limit) continue;
    if (c.min_order_value && subtotal < c.min_order_value) continue;

    const applicableProductIds = c.product_coupons?.map((pc) => pc.product_id).filter(Boolean) || [];
    if (applicableProductIds.length > 0) {
      const hasApplicable = productIds.some(id => applicableProductIds.includes(id));
      if (!hasApplicable) continue;
    }

    let calcDiscount = 0;
    const dType = c.discount_type || 'percentage';
    const dVal = Number(c.discount || 0);

    if (dType === 'percentage') {
      calcDiscount = Math.round((subtotal * dVal) / 100);
    } else {
      calcDiscount = dVal;
    }

    eligible.push({
      code: c.code,
      discountType: dType,
      discountValue: dVal,
      calculatedDiscount: Math.min(calcDiscount, subtotal)
    });
  }

  eligible.sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);

  console.log("Eligible coupons sorted by discount:", eligible);
  if (eligible.length > 0) {
    console.log(`✅ Best Coupon Auto-Selected: ${eligible[0].code} with ₹${eligible[0].calculatedDiscount} discount!`);
  } else {
    console.log("No eligible coupons found.");
  }
}

run();
