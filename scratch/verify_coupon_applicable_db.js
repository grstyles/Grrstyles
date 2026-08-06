const { Client } = require('pg');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  console.log('Connecting via PG 54.254.195.121:6543 to check is_coupon_applicable column...');
  const client = new Client({
    host: '54.254.195.121',
    port: 6543,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    
    // Add columns if not already existing
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`);
    await client.query(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`);
    await client.query(`UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`);
    await client.query(`UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`);

    const res = await client.query(`SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'products' AND (column_name LIKE '%coupon%' OR column_name LIKE '%delivery%');`);
    console.log('Product columns:', res.rows);
    
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Reload schema notification sent!');
    await client.end();
  } catch (e) {
    console.error('PG query error:', e);
  }
}

run();
