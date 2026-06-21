const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';

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
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
    }
  });
}

if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrder() {
  const testOrderData = {
    order_number: `GR-TEST-${Date.now()}`,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '1234567890',
    shipping_address: { address: '123 Test St', city: 'Test City', state: 'TS', zip: '12345', country: 'Test' },
    total_amount: 100.00,
    status: 'Pending',
    payment_status: 'Pending',
    items: [
      {
        productId: '00000000-0000-0000-0000-000000000000',
        productName: 'Test Product',
        size: 'M',
        quantity: 1,
        price: 100.00
      }
    ]
  };

  const { data, error } = await supabase.from('orders').insert(testOrderData).select('*');
  console.log('Order insert result:', { data, error });
}

testOrder().catch(console.error);
