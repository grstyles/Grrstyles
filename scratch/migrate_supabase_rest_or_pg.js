const { Client } = require('pg');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  dns.lookup('aws-0-ap-southeast-1.pooler.supabase.com', { family: 4 }, async (err, address) => {
    console.log('Resolved IPv4 address:', address);
    const host = address || '54.254.195.121';
    
    const client = new Client({
      host: host,
      port: 6543,
      user: 'postgres.xqxnezvhrmyndpsfmrbc',
      password: 'Vyshur@m14321',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log('Connected!');

      const sqls = [
        `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`,
        `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`,
        `UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`,
        `UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`
      ];

      for (const s of sqls) {
        await client.query(s);
        console.log('Executed:', s);
      }
      await client.end();
      console.log('Migration complete!');
    } catch (e) {
      console.error('PG Connect Error:', e);
    }
  });
}

run();
