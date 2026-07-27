const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function run() {
  console.log('--- ADMIN CLIENT ---');
  const { data: data1, error: err1 } = await supabaseAdmin
    .from('shipping_settings')
    .select('shipping_charge, free_shipping_above, free_delivery')
    .eq('id', 1)
    .single();
  console.log('Admin:', data1, err1);

  console.log('--- ANON CLIENT ---');
  const { data: data2, error: err2 } = await supabaseAnon
    .from('shipping_settings')
    .select('shipping_charge, free_shipping_above, free_delivery')
    .eq('id', 1)
    .single();
  console.log('Anon:', data2, err2);
}

run();
