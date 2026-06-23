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

const cleanedUrl = (supabaseUrl || '').trim().replace(/\/rest\/v1\/?$/, '');
const supabase = createClient(cleanedUrl, supabaseKey);

async function run() {
  console.log(`Attempting login for ${adminEmail}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });
  if (error) {
    console.error('Login failed:', error);
  } else {
    console.log('Login successful! User ID:', data.user.id);
    
    // Print session info
    console.log('SESSION:', await supabase.auth.getSession());
    
    // Call is_admin RPC
    console.log('Calling is_admin RPC...');
    const { data: isAdminResult, error: rpcError } = await supabase
      .rpc('is_admin');
      
    if (rpcError) {
      console.log('RPC is_admin error:', rpcError.message || rpcError);
    } else {
      console.log('RPC is_admin result:', isAdminResult);
    }
    
    // Query profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile fetched:', profile);
    }

    console.log('Attempting to update profile...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        full_name: 'GR STYLES ADMIN'
      })
      .eq('id', data.user.id)
      .select();

    if (updateError) {
      console.log('Update error:', updateError.message || updateError);
    } else {
      console.log('Update result:', updateData);
    }
  }
}

run().catch(console.error);
