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
  const queries = [
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric(10, 2);",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_amount numeric(10, 2) DEFAULT 0;",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10, 2) DEFAULT 0;"
  ];

  for (const q of queries) {
    const { error } = await supabase.rpc('execute_sql', { query: q });
    if (error) {
      console.log('rpc execute_sql error for query:', q, error.message);
    } else {
      console.log('Successfully ran:', q);
    }
  }

  // Check columns after alter
  const { data } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders columns:', data && data[0] ? Object.keys(data[0]) : 'empty');
}

run();
