const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('--- RUNNING DUAL COUPON ENGINE MIGRATION ---');

  const client = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database successfully.');

    const sqlPath = path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('Migration executed successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run().catch(console.error);
