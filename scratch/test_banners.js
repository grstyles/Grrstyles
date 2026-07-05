require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBanners() {
  console.log("Checking banners table...");
  const { data, error } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(1);
  if (error) {
    console.error("Banner Query Error", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
    });
  } else {
    console.log("Banners query succeeded. Data:", data);
  }
}

checkBanners();
