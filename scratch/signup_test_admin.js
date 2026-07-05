const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';

const envLocalPath = 'C:\\Users\\hp\\Documents\\AUTOFIT AGENCEY\\gr_styles\\.env.local';
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
    }
  });
}

const cleanedUrl = (supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(cleanedUrl, supabaseKey);

async function run() {
  const email = `grstyles_test_admin_${Date.now()}@gmail.com`;
  console.log(`Signing up test user: ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'Vyshur@m14321',
    options: {
      data: {
        role: 'admin',
        full_name: 'Test Admin'
      }
    }
  });
  if (error) {
    console.error('Signup failed:', error);
  } else {
    console.log('Signup success! User ID:', data.user.id);
    console.log('Session created:', !!data.session);
    console.log('Email verified:', data.user.email_verified);
  }
}

run().catch(console.error);
