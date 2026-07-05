const { Client } = require('pg');
const fs = require('fs');

const sqlContent = fs.readFileSync('C:\\Users\\hp\\Documents\\AUTOFIT AGENCEY\\gr_styles\\supabase_inventory_migration.sql', 'utf8');

async function tryConnectAndRun(port) {
  console.log(`Connecting to db.xqxnezvhrmyndpsfmrbc.supabase.co on port ${port}...`);
  const client = new Client({
    connectionString: `postgresql://postgres:Vyshur%40m14321@db.xqxnezvhrmyndpsfmrbc.supabase.co:${port}/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully! Running SQL...');
    
    // Execute SQL content
    const res = await client.query(sqlContent);
    console.log('SQL executed successfully!');
    
    await client.end();
    return true;
  } catch (err) {
    console.error(`Failed on port ${port}:`, err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const success = await tryConnectAndRun(6543);
  if (!success) {
    console.log('Trying port 5432...');
    await tryConnectAndRun(5432);
  }
}

run().catch(console.error);
