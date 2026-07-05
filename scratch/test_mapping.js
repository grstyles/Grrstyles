require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Minimal mapDbProduct
function mapDbProduct(db) {
  return {
    id: db.id,
    name: db.name,
    shirtStock: db.shirt_stock || {},
    pantStock: db.pant_stock || {},
    shoeStock: db.shoe_stock || {},
    overallStock: db.overall_stock || 0,
  };
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  const dbProduct = data[0];
  console.log("DB Product Keys:", Object.keys(dbProduct));
  console.log("DB Product shirt_stock:", dbProduct.shirt_stock);
  const mapped = mapDbProduct(dbProduct);
  console.log("Mapped shirtStock:", mapped.shirtStock);
}
run();
