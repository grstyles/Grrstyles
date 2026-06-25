const { Client } = require('pg');

async function testConfig(dbName, user) {
  const host = 'aws-0-ap-south-1.pooler.supabase.com';
  console.log(`Testing pooler with database: ${dbName}, user: ${user}...`);
  const client = new Client({
    user: user,
    host: host,
    database: dbName,
    password: 'Vyshur@m14321',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('  SUCCESS!');
    const res = await client.query('SELECT 1 as val');
    console.log('  Result:', res.rows);
    await client.end();
    return true;
  } catch (err) {
    console.log('  Failed:', err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const dbNames = ['postgres.xqxnezvhrmyndpsfmrbc', 'xqxnezvhrmyndpsfmrbc', 'postgres'];
  const users = ['postgres', 'postgres.xqxnezvhrmyndpsfmrbc'];
  
  for (const dbName of dbNames) {
    for (const user of users) {
      const ok = await testConfig(dbName, user);
      if (ok) {
        console.log('Found working config!');
        process.exit(0);
      }
    }
  }
  console.log('All configurations failed.');
}

main().catch(console.error);
