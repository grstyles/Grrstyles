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
  console.log('Testing update with color...');
  const { data: d1, error: e1 } = await supabase
    .from('products')
    .update({ color: 'Maroon' })
    .eq('slug', 'white-baggy-pant')
    .select();
  
  if (e1) {
    console.log('Color update failed:', e1.message || e1);
  } else {
    console.log('Color update SUCCEEDED! Result:', d1);
  }

  console.log('\nTesting update with image_colors...');
  const { data: d2, error: e2 } = await supabase
    .from('products')
    .update({ image_colors: [{ image: 'test.jpg', color: 'White' }] })
    .eq('slug', 'white-baggy-pant')
    .select();
  
  if (e2) {
    console.log('Image_colors update failed:', e2.message || e2);
  } else {
    console.log('Image_colors update SUCCEEDED! Result:', d2);
  }
}

run().catch(console.error);
