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
    SELECT tgname, tgfoid::regproc
    FROM pg_trigger
    WHERE tgrelid = 'products'::regclass;
  `);
  console.log(res.rows);
  await client.end();
}
run();
