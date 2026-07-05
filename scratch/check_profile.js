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
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
    }
  });
}

const cleanedUrl = (supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(cleanedUrl, supabaseKey);

async function checkProfile() {
  console.log('Querying profile for grstyles955@gmail.com...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'grstyles955@gmail.com')
    .maybeSingle();

  if (error) {
    console.error('Failed to query profiles:', error.message || error);
  } else if (!data) {
    console.log('No profile found for grstyles955@gmail.com.');
  } else {
    console.log('Profile found:', data);
  }
}

checkProfile().catch(console.error);
