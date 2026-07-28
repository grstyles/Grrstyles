const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function testApply(code, validationData) {
  const { data } = await supabase
    .from('coupons')
    .select('*, product_coupons(product_id)')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .maybeSingle();

  if (!data) return { valid: false, message: 'Invalid coupon code.' };

  if (validationData) {
    if (data.min_order_value && validationData.subtotal < data.min_order_value) {
      return { valid: false, message: `Minimum order value of ₹${data.min_order_value} required.` };
    }

    const applicableProductIds = data.product_coupons?.map((pc) => pc.product_id).filter(Boolean) || [];
    if (applicableProductIds.length > 0) {
      const validIdentifiers = new Set(applicableProductIds);
      try {
        const { data: matchedProducts } = await supabase
          .from('products')
          .select('id, slug, sku')
          .in('id', applicableProductIds);
        if (matchedProducts) {
          matchedProducts.forEach((p) => {
            if (p.id) validIdentifiers.add(p.id);
            if (p.slug) validIdentifiers.add(p.slug);
            if (p.sku) validIdentifiers.add(p.sku);
          });
        }
      } catch (e) {
        console.warn('Error expanding applicable product identifiers:', e);
      }

      console.log("Valid Identifiers Set:", Array.from(validIdentifiers));
      console.log("Validation Product IDs:", validationData.productIds);

      const hasApplicableProduct = validationData.productIds.some(id => validIdentifiers.has(id));
      if (!hasApplicableProduct) {
        return { valid: false, message: 'Coupon is not applicable to the items in your cart.' };
      }
    }
  }

  return { valid: true, message: 'Coupon applied successfully!' };
}

async function run() {
  // Test case 1: Cart item passed with SLUG
  console.log("--- TEST CASE 1: Cart item with slug 'trending-viral-pink-shirt' ---");
  const res1 = await testApply('WELCOME100', { subtotal: 1000, productIds: ['trending-viral-pink-shirt'] });
  console.log("Result 1:", res1);

  // Test case 2: Cart item passed with UUID
  console.log("\n--- TEST CASE 2: Cart item with UUID 'e2db5977-2257-47e6-ac6b-36580cf9feda' ---");
  const res2 = await testApply('WELCOME100', { subtotal: 1000, productIds: ['e2db5977-2257-47e6-ac6b-36580cf9feda'] });
  console.log("Result 2:", res2);

  // Test case 3: Unmatched product
  console.log("\n--- TEST CASE 3: Unmatched product 'unrelated-product-slug' ---");
  const res3 = await testApply('WELCOME100', { subtotal: 1000, productIds: ['unrelated-product-slug'] });
  console.log("Result 3:", res3);
}

run();
