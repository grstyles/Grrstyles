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

async function testRpc(name, sql) {
  try {
    console.log(`Testing RPC '${name}' with: ${sql}`);
    const { data, error } = await supabase.rpc(name, { query: sql, sql: sql, query_text: sql });
    if (error) {
      console.log(`  RPC '${name}' failed:`, error.message);
    } else {
      console.log(`  RPC '${name}' SUCCEEDED! Result:`, data);
      return true;
    }
  } catch (err) {
    console.log(`  RPC '${name}' error:`, err.message || err);
  }
  return false;
}

async function main() {
  const sql = 'SELECT 1 as val';
  const rpcNames = ['exec_sql', 'execute_sql', 'run_sql', 'exec', 'query', 'sql'];
  for (const name of rpcNames) {
    const ok = await testRpc(name, sql);
    if (ok) {
      console.log(`Found working RPC SQL runner: ${name}`);
      process.exit(0);
    }
  }
  console.log('No working RPC SQL runner found.');
}

main().catch(console.error);
