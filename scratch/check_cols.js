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
  const { data: orders } = await supabase.from('orders').select('*').limit(1);
  const { data: items } = await supabase.from('order_items').select('*').limit(1);
  console.log('orders columns:', orders && orders.length > 0 ? Object.keys(orders[0]) : 'empty');
  console.log('order_items columns:', items && items.length > 0 ? Object.keys(items[0]) : 'empty');
}

run();
