const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Resolving Supabase pooler IPs...');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_coupons_dual_engine_migration.sql'), 'utf8');

  dns.resolve4('aws-0-ap-southeast-1.pooler.supabase.com', async (err1, ips1) => {
    dns.resolve4('aws-0-ap-south-1.pooler.supabase.com', async (err2, ips2) => {
      const allIps = [...(ips1 || []), ...(ips2 || [])];
      console.log('All resolved Pooler IPs:', allIps);

      for (const ip of allIps) {
        for (const port of [6543, 5432]) {
          console.log(`Attempting migration on ${ip}:${port}...`);
          const client = new Client({
            host: ip,
            port: port,
            user: 'postgres.xqxnezvhrmyndpsfmrbc',
            password: 'Vyshur@m14321',
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
          });

          try {
            await client.connect();
            console.log(`🎉 CONNECTED TO ${ip}:${port}!`);
            await client.query(sql);
            console.log('🎉 MIGRATION EXECUTED SUCCESSFULLY!');
            await client.end();
            return;
          } catch (e) {
            console.log(`Failed ${ip}:${port}:`, e.message);
            try { await client.end(); } catch(ignore) {}
          }
        }
      }
      console.log('Could not connect to any pooler IP.');
    });
  });
}

run().catch(console.error);
