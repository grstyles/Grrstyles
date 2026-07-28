const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('--- RUNNING DUAL COUPON ENGINE MIGRATION VIA WORKING POOLER ---');

  const client = new Client({
    host: '13.214.204.4',
    port: 5432,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully to Supabase DB via pooler!');

    const sqlPath = path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('🎉 MIGRATION EXECUTED SUCCESSFULLY ON SUPABASE DATABASE!');
    await client.end();
  } catch (err) {
    console.error('Migration execution error:', err);
    process.exit(1);
  }
}

run().catch(console.error);
