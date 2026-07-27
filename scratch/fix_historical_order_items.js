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
  console.log('=== FIXING HISTORICAL ORDER ITEMS PRICES IN DATABASE ===');

  const { data: orders, error } = await supabase.from('orders').select('*, order_items(*)');
  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  for (const order of orders) {
    const items = order.order_items || [];
    if (items.length === 0) continue;

    const discount = Number(order.discount_amount || 0);
    const shipping = Number(order.shipping_amount || 0);
    const grandTotal = Number(order.total_amount);

    // If order has single item and item.price is MRP (greater than paid total)
    if (items.length === 1) {
      const item = items[0];
      const itemsSum = Number(item.price) * item.quantity;

      // If grandTotal is 1 (Razorpay test payment) or grandTotal < itemsSum without discount
      if (grandTotal === 1 && item.price > 1) {
        console.log(`Fixing order ${order.order_number}: item price was ${item.price}, updating to 1 to match Razorpay test payment.`);
        await supabase.from('order_items').update({ price: 1 }).eq('id', item.id);
        await supabase.from('orders').update({ subtotal: 1, shipping_amount: 0 }).eq('id', order.id);
      } else if (itemsSum > grandTotal && discount === 0) {
        // e.g. grandTotal = 679 (529 + 150 shipping), item.price = 1000
        // Check if grandTotal has shipping component or matches selling price
        const targetSubtotal = grandTotal > 150 && (grandTotal - 150 === 529 || grandTotal === 679) ? (grandTotal > 150 ? grandTotal - 150 : grandTotal) : grandTotal;
        const correctUnitPrice = targetSubtotal / item.quantity;

        console.log(`Fixing order ${order.order_number}: updating item unit price from ${item.price} to ${correctUnitPrice}`);
        await supabase.from('order_items').update({ price: correctUnitPrice }).eq('id', item.id);
        await supabase.from('orders').update({ subtotal: targetSubtotal, shipping_amount: grandTotal > targetSubtotal ? grandTotal - targetSubtotal : 0 }).eq('id', order.id);
      }
    }
  }

  console.log('Finished updating historical orders.');
}

run();
