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

console.log('Read env vars from .env.local:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey);

// Clean URL as config.ts does
const cleanedUrl = (supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/, '');
console.log('Cleaned Supabase URL:', cleanedUrl);

if (!cleanedUrl || !supabaseKey) {
  console.log('Error: Missing configuration URL or Key');
  process.exit(1);
}

const supabase = createClient(cleanedUrl, supabaseKey);

async function testConnection() {
  console.log('\nTesting connection by listing 1 row from products...');
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Connection/Query error:', error);
  } else {
    console.log('Success! Data returned:', data);
  }
}

testConnection().catch(console.error);
