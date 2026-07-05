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
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'product_coupons';
  `);
  console.log(res.rows);
  await client.end();
}
run();
