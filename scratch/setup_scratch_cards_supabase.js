const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
    }
  });
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  // Test settings table
  const settingsRes = await supabase.from('scratch_card_settings').select('*').limit(1);
  console.log('Settings res:', settingsRes.error ? settingsRes.error.message : settingsRes.data);

  // Test scratch_cards table
  const cardsRes = await supabase.from('scratch_cards').select('*').limit(1);
  console.log('Cards res:', cardsRes.error ? cardsRes.error.message : cardsRes.data);

  // Test user_scratch_cards table
  const userCardsRes = await supabase.from('user_scratch_cards').select('*').limit(1);
  console.log('User Cards res:', userCardsRes.error ? userCardsRes.error.message : userCardsRes.data);
}

testTables();
