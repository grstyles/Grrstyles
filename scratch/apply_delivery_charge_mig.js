const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  console.log('--- RUNNING PRODUCT DELIVERY CHARGE MIGRATION ---');

  const connectionStrings = [
    "postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    "postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:6543/postgres",
    "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:5432/postgres"
  ];

  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_delivery_charge_migration.sql'), 'utf8');

  for (const connStr of connectionStrings) {
    console.log('Trying connection:', connStr.replace(/:Vyshur%40m14321@/, ':***@'));
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('Connected!');
      await client.query(sql);
      console.log('Migration executed successfully!');
      await client.end();
      return;
    } catch (err) {
      console.log('Connection failed:', err.message);
      try { await client.end(); } catch (e) {}
    }
  }
}

run();
