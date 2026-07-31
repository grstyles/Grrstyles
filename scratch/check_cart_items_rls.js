const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to DB!');

  const policiesRes = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'cart_items';
  `);
  console.log('--- Policies on cart_items ---');
  console.log(JSON.stringify(policiesRes.rows, null, 2));

  const cartsPoliciesRes = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'carts';
  `);
  console.log('--- Policies on carts ---');
  console.log(JSON.stringify(cartsPoliciesRes.rows, null, 2));

  await client.end();
}

run().catch(console.error);
