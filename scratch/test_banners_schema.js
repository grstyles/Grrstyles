require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking banners schema...");
  
  // Since we cannot query information_schema directly via REST API usually, 
  // I will just select one row to get all the columns if it exists, or insert and select.
  // Actually, we can fetch an empty array and see the columns by inserting and rolling back or just by inserting a dummy record.
  
  const { data, error } = await supabase.from('banners').insert({ title: 'Test Schema', active: true }).select('*');
  if (error) {
    console.error("Insert Error", error);
  } else {
    console.log("Schema Columns:", Object.keys(data[0]));
    
    // delete it
    await supabase.from('banners').delete().eq('id', data[0].id);
  }
}

checkSchema();
