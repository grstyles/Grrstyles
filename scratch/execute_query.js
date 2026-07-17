const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders';
  `;

  const { data, error } = await supabase.rpc('execute_sql', { query: sql });
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('Columns of orders table via execute_sql:');
    console.log(data);
  }
}

run();
