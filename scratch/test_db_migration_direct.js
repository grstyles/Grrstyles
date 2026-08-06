const { Client } = require('pg');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function testPg(host, port, user, dbname = 'postgres') {
  console.log(`Connecting to ${host}:${port} user=${user} db=${dbname}...`);
  const client = new Client({
    host,
    port,
    user,
    password: 'Vyshur@m14321',
    database: dbname,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log(`SUCCESS connected to ${host}:${port}`);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`);
    await client.query(`UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`);
    await client.query(`UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`);
    console.log('SQL Migration executed successfully!');
    await client.end();
    return true;
  } catch (e) {
    console.log(`Failed ${host}:${port}:`, e.message);
    return false;
  }
}

async function run() {
  // Try direct db host
  dns.lookup('db.xqxnezvhrmyndpsfmrbc.supabase.co', { family: 4 }, async (err, address) => {
    console.log('db.xqxnezvhrmyndpsfmrbc.supabase.co IPv4:', address);
    if (address) {
      if (await testPg(address, 5432, 'postgres')) return;
      if (await testPg(address, 6543, 'postgres.xqxnezvhrmyndpsfmrbc')) return;
    }
    
    // Try pooler IP addresses
    dns.lookup('aws-0-ap-southeast-1.pooler.supabase.com', { family: 4 }, async (err2, poolerIp) => {
      console.log('aws-0-ap-southeast-1.pooler.supabase.com IPv4:', poolerIp);
      if (poolerIp) {
        if (await testPg(poolerIp, 5432, 'postgres.xqxnezvhrmyndpsfmrbc')) return;
        if (await testPg(poolerIp, 6543, 'postgres.xqxnezvhrmyndpsfmrbc')) return;
      }
    });
  });
}

run();
