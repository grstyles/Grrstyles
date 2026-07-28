const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let serviceKey = '';

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
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectSchema() {
  const { data: coupons, error: cErr } = await supabase.from('coupons').select('*').limit(1);
  console.log('--- COUPONS TABLE ---');
  if (cErr) console.error('Coupons err:', cErr);
  else console.log('Coupons keys:', coupons.length > 0 ? Object.keys(coupons[0]) : 'Empty table');

  const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(1);
  console.log('--- ORDERS TABLE ---');
  if (oErr) console.error('Orders err:', oErr);
  else console.log('Orders keys:', orders.length > 0 ? Object.keys(orders[0]) : 'Empty table');
}

inspectSchema().catch(console.error);
