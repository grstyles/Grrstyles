const { Client } = require('pg');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  console.log('Connecting via SNI to Supabase pooler...');
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
      servername: 'aws-0-ap-southeast-1.pooler.supabase.com',
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('CONNECTED SUCCESSFULLY WITH SNI!');
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`);
    await client.query(`UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`);
    await client.query(`UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`);
    console.log('SUCCESS! Migration completed.');
    await client.end();
  } catch (e) {
    console.error('SNI Connect error:', e);
  }
}

run();
