const { Client } = require('pg');

async function main() {
  console.log('Testing direct connection to Supabase DB...');
  const client = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Direct connection SUCCESS!');
    const res = await client.query('SELECT version();');
    console.log('Database version:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.log('Direct connection FAILED:', err.message || err);
  }
}

main().catch(console.error);
