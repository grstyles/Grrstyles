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

async function inspectColumns() {
  const url = `${cleanedUrl}/rest/v1/?apikey=${supabaseKey}`;
  console.log('Fetching OpenAPI schema from:', cleanedUrl);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }
  
  const schema = await response.json();
  const productsDef = schema.definitions && schema.definitions.products;
  if (!productsDef) {
    console.log('Products definition not found. Available tables:', Object.keys(schema.definitions || {}));
    return;
  }
  
  console.log('\nProducts table columns and types:');
  const properties = productsDef.properties || {};
  Object.keys(properties).forEach(col => {
    console.log(`- ${col}: ${properties[col].type} (${properties[col].format || 'no format'})`);
  });
}

inspectColumns().catch(console.error);
