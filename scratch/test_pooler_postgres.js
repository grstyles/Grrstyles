const { Client } = require('pg');

async function run() {
  const host = 'aws-0-ap-south-1.pooler.supabase.com';
  const client = new Client({
    user: 'postgres',
    host: host,
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT 1');
    console.log('Query successful:', res.rows);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    try { await client.end(); } catch (e) {}
  }
}

run().catch(console.error);
