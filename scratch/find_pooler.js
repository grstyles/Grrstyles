const { Client } = require('pg');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const hosts = [
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'db.xqxnezvhrmyndpsfmrbc.supabase.co'
];

async function tryHost(host) {
  const client = new Client({
    host,
    port: 6543,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false, servername: host },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    console.log('SUCCESS CONNECTED TO:', host);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`);
    await client.query(`UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`);
    await client.query(`UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`);
    console.log('Columns added successfully!');
    await client.end();
    return true;
  } catch (e) {
    console.log(`Host ${host} failed:`, e.message);
    return false;
  }
}

async function run() {
  for (const h of hosts) {
    if (await tryHost(h)) break;
  }
}

run();
