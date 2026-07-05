require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking banners table...");
  const { data, error } = await supabase.from('banners').select('*').limit(1);
  if (error) {
    console.error("Error querying banners table:", error);
    if (error.code === '42P01') {
      console.log("Table does not exist!");
    }
  } else {
    console.log("Query succeeded. Data:", data);
  }
}

checkSchema();
