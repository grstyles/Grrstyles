const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn(colName) {
  const { data, error } = await supabase
    .from('orders')
    .select(colName)
    .limit(1);

  if (error) {
    console.log(`Column '${colName}' check failed:`, error.message);
  } else {
    console.log(`Column '${colName}' exists!`);
  }
}

async function run() {
  await checkColumn('customer_id');
  await checkColumn('profile_id');
  await checkColumn('uid');
  await checkColumn('id_user');
}

run();
