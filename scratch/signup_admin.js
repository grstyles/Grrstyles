const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';
let adminEmail = '';
let adminPassword = '';

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
      if (key === 'NEXT_PUBLIC_ADMIN_EMAIL') adminEmail = value;
      if (key === 'ADMIN_PASSWORD') adminPassword = value;
    }
  });
}

if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function signupAdmin() {
  console.log('Signing up admin...');
  const { data, error } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        full_name: 'GR STYLES ADMIN',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Sign up failed:', error);
  } else {
    console.log('Sign up successful! Data:', JSON.stringify(data, null, 2));
  }
}

signupAdmin().catch(console.error);
