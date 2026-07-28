const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Testing DNS resolution using 8.8.8.8...');
  dns.lookup('db.xqxnezvhrmyndpsfmrbc.supabase.co', (err, address, family) => {
    console.log('DNS lookup result for db.xqxnezvhrmyndpsfmrbc.supabase.co:', { err, address, family });
  });

  dns.lookup('aws-0-ap-south-1.pooler.supabase.com', (err, address, family) => {
    console.log('DNS lookup result for aws-0-ap-south-1.pooler.supabase.com:', { err, address, family });
  });

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
    console.log('🎉 SUCCESS CONNECTED TO SUPABASE DB VIA DIRECT HOST!');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql'), 'utf8');
    await client.query(sql);
    console.log('🎉 MIGRATION SQL EXECUTED SUCCESSFULLY!');
    await client.end();
  } catch (err) {
    console.error('Connection/Query error:', err.message);
  }
}

run().catch(console.error);
