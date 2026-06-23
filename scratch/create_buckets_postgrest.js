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
// Initialize client selecting the storage schema
const supabaseStorage = createClient(cleanedUrl, supabaseKey, {
  db: { schema: 'storage' }
});

async function run() {
  console.log('Attempting to insert buckets into storage.buckets table...');
  const bucketsToInsert = [
    { id: 'products', name: 'products', public: true },
    { id: 'banners', name: 'banners', public: true },
    { id: 'collections', name: 'collections', public: true },
    { id: 'brands', name: 'brands', public: true }
  ];

  const { data, error } = await supabaseStorage
    .from('buckets')
    .insert(bucketsToInsert)
    .select('*');

  if (error) {
    console.error('Error inserting into storage.buckets:', error);
  } else {
    console.log('Successfully inserted buckets:', data);
  }
}

run().catch(console.error);
