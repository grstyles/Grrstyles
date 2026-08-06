const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function testTargetedProductCoupons() {
  console.log("=== TESTING TARGETED PRODUCT COUPONS ===");
  
  const { data: couponRows } = await supabase.from('product_coupons').select('*');
  console.log("Product coupons links:", couponRows);

  if (couponRows && couponRows.length > 0) {
    const productIds = couponRows.map(pc => pc.product_id);
    const { data: products } = await supabase.from('products').select('*').in('id', productIds);
    const { data: coupons } = await supabase.from('coupons').select('*, product_coupons(*)');

    for (const product of (products || [])) {
      console.log(`\nProduct: "${product.name || product.title}" (ID: ${product.id}, Price: ₹${product.price})`);
      const effectivePrice = Number(product.discounted_price || product.price || 0);
      const now = new Date();
      const applicable = [];

      for (const c of coupons) {
        if (c.active === false || c.is_active === false) continue;
        if (c.start_date && new Date(c.start_date) > now) continue;
        const expDate = c.expiry_date || c.end_date;
        if (expDate && new Date(expDate) < now) continue;

        const pcs = c.product_coupons || [];
        if (pcs.length > 0) {
          const matched = pcs.some(pc => pc.product_id === product.id || pc.product_id === product.slug);
          if (!matched) continue;
        }

        applicable.push({
          code: c.code,
          discountType: c.discount_type,
          discountValue: c.discount_value || c.discount,
          description: c.description
        });
      }

      console.log(` -> ACTIVE APPLICABLE COUPONS (${applicable.length}):`);
      applicable.forEach(app => {
        console.log(`    [BADGE DISPLAY] Code: ${app.code} | Discount: ${app.discountType === 'percentage' ? app.discountValue + '%' : '₹' + app.discountValue} OFF | Desc: "${app.description}"`);
      });
    }
  }
}

testTargetedProductCoupons();
