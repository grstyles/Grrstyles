require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('shipping_settings').select('*');
  if (error) {
    console.error("Error fetching shipping settings:", error);
  } else {
    console.log("shipping_settings table rows:", data);
  }
}
run();
