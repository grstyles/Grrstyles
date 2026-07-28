const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Connecting to pooler IP 65.0.195.55...');

  const ports = [5432, 6543];
  for (const port of ports) {
    const client = new Client({
      host: '65.0.195.55',
      port: port,
      user: 'postgres.xqxnezvhrmyndpsfmrbc',
      password: 'Vyshur@m14321',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      servername: 'aws-0-ap-south-1.pooler.supabase.com'
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS CONNECTED TO POOLER ON PORT ${port}!`);
      const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql'), 'utf8');
      await client.query(sql);
      console.log('🎉 MIGRATION SQL EXECUTED SUCCESSFULLY!');
      await client.end();
      return;
    } catch (err) {
      console.error(`Port ${port} error:`, err.message);
      try { await client.end(); } catch(e) {}
    }
  }
}

run().catch(console.error);
