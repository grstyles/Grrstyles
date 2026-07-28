const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1'
];

async function testPooler(region) {
  const domain = `aws-0-${region}.pooler.supabase.com`;
  return new Promise((resolve) => {
    dns.resolve4(domain, async (err, ips) => {
      if (err || !ips || ips.length === 0) return resolve(false);
      
      for (const ip of ips) {
        for (const port of [5432, 6543]) {
          const client = new Client({
            host: ip,
            port: port,
            user: 'postgres.xqxnezvhrmyndpsfmrbc',
            password: 'Vyshur@m14321',
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
          });

          try {
            await client.connect();
            console.log(`🎉 SUCCESS! Region: ${region}, IP: ${ip}, Port: ${port}`);
            await client.query('SELECT 1');
            await client.end();
            resolve({ region, ip, port });
            return;
          } catch (e) {
            try { await client.end(); } catch(ignore) {}
          }
        }
      }
      resolve(false);
    });
  });
}

async function main() {
  console.log('Testing all Supabase pooler regions...');
  for (const r of regions) {
    const res = await testPooler(r);
    if (res) {
      console.log('Found working pooler!', res);
      return res;
    }
  }
  console.log('No pooler matched.');
}

main().catch(console.error);
