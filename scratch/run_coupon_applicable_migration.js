const { Client } = require('pg');
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  console.log('Connecting directly to Supabase Postgres pooler (54.254.195.121:6543)...');
  const client = new Client({
    host: '54.254.195.121',
    port: 6543,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL!');

  const statements = [
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coupon_applicable boolean DEFAULT true;`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coupon_applicable boolean DEFAULT true;`,
    `UPDATE public.products SET is_coupon_applicable = true WHERE is_coupon_applicable IS NULL;`,
    `UPDATE public.products SET coupon_applicable = true WHERE coupon_applicable IS NULL;`
  ];

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('Successfully executed:', stmt);
    } catch (e) {
      console.error('Error executing statement:', stmt, e.message);
    }
  }

  await client.end();
  console.log('Database migration complete!');
}

run().catch(console.error);
