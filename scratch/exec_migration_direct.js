const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql'), 'utf8');

  const configs = [
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432, user: 'postgres.xqxnezvhrmyndpsfmrbc' },
    { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: 'postgres.xqxnezvhrmyndpsfmrbc' },
    { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 5432, user: 'postgres.xqxnezvhrmyndpsfmrbc' },
    { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 6543, user: 'postgres.xqxnezvhrmyndpsfmrbc' }
  ];

  for (const cfg of configs) {
    console.log(`Trying ${cfg.host}:${cfg.port}...`);
    const client = new Client({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: 'Vyshur@m14321',
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`Connected successfully to ${cfg.host}:${cfg.port}!`);
      await client.query(sql);
      console.log('Migration executed successfully!');
      await client.end();
      return;
    } catch (e) {
      console.log(`Failed ${cfg.host}:${cfg.port}:`, e.message);
      try { await client.end(); } catch(err) {}
    }
  }
}

run().catch(console.error);
