require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log("Checking products table...");
  const { data, error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    console.error("Error querying products table:", error);
  } else {
    console.log("Query succeeded. Data:", data);
  }
}

checkProducts();
