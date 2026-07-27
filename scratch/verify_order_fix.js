const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"]|['"]$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('=== VERIFYING ORDER AMOUNT FIX ===');

  const { data: dbOrders, error } = await supabase.from('orders').select('*, order_items(*)');
  if (error) {
    console.error('Database query error:', error);
    return;
  }

  console.log(`Fetched ${dbOrders.length} orders from Supabase DB.`);

  let allPassed = true;

  for (const d of dbOrders) {
    const items = (d.order_items || []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: Number(item.price)
    }));
    const itemsSum = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = Number(d.discount_amount || 0);
    const tax = d.tax_amount != null ? Number(d.tax_amount) : 0;
    const grandTotal = Number(d.total_amount);
    const subtotal = d.subtotal != null ? Number(d.subtotal) : itemsSum;
    const shipping = d.shipping_amount != null 
      ? Number(d.shipping_amount) 
      : Math.max(0, grandTotal - subtotal + discount - tax);

    // Check Math Rule: Subtotal - Discount + Shipping + Tax == Grand Total
    const computedGrandTotal = subtotal - discount + shipping + tax;

    if (Math.abs(computedGrandTotal - grandTotal) > 0.01) {
      console.error(`❌ Order ${d.order_number}: Math mismatch! grandTotal=${grandTotal}, computed=${computedGrandTotal}`);
      allPassed = false;
    } else {
      console.log(`✅ Order ${d.order_number}: Subtotal=₹${subtotal}, Shipping=₹${shipping}, Discount=₹${discount}, Tax=₹${tax}, GrandTotal=₹${grandTotal}`);
    }
  }

  if (allPassed) {
    console.log('\n🎉 ALL ORDERS BALANCED PERFECTLY AND CONSISTENTLY!');
  } else {
    console.error('\n⚠️ SOME ORDERS FAILED VERIFICATION.');
  }
}

run();
