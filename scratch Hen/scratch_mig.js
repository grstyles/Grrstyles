const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Resolving aws-0-ap-southeast-1.pooler.supabase.com...');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql'), 'utf8');

  dns.resolve4('aws-0-ap-southeast-1.pooler.supabase.com', async (err, ips) => {
    console.log('IPs:', ips);
    if (!ips || ips.length === 0) return;

    for (const ip of ips) {
      for (const port of [6543, 5432]) {
        console.log(`Connecting to ${ip}:${port}...`);
        const client = new Client({
          host: ip,
          port: port,
          user: 'postgres.xqxnezvhrmyndpsfmrbc',
          password: 'Vyshur@m14321',
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
          servername: 'aws-0-ap-southeast-1.pooler.supabase.com'
        });

        try {
          await client.connect();
          console.log(`🎉 CONNECTED TO ${ip}:${port}!`);
          await client.query(sql);
          console.log('🎉 MIGRATION EXECUTED SUCCESSFULLY!');
          await client.end();
          return;
        } catch (e) {
          console.log(`Err ${ip}:${port}:`, e.message);
          try { await client.end(); } catch(ignore) {}
        }
      }
    }
  });
}

run().catch(console.error);
