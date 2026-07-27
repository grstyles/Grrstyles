const { Client } = require('pg');

async function testPooler() {
  const connectionString = `postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  console.log('Connecting to pooler:', connectionString);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('CONNECTED SUCCESS!');
    const res = await client.query('SELECT 1 as result;');
    console.log('Query result:', res.rows);
    await client.end();
  } catch (err) {
    console.error('Pooler Error:', err);
  }
}

testPooler();
