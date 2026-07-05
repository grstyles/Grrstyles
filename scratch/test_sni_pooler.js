const { Client } = require('pg');
const net = require('net');

async function testConfig(port, user) {
  console.log(`Testing SNI pooler on port ${port} with user ${user}...`);
  
  // Resolve pooler IP
  const poolerIp = '3.108.251.216'; // ap-south-1 pooler IPv4
  
  const client = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co', // Sets the TLS SNI
    user: user,
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: port,
    ssl: { rejectUnauthorized: false },
    stream: net.createConnection(port, poolerIp)
  });

  try {
    await client.connect();
    console.log('  SUCCESS!');
    const res = await client.query('SELECT 1 as val');
    console.log('  Query result:', res.rows);
    await client.end();
    return true;
  } catch (err) {
    console.log('  Failed:', err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const users = ['postgres.xqxnezvhrmyndpsfmrbc', 'postgres'];
  const ports = [5432, 6543];
  
  for (const user of users) {
    for (const port of ports) {
      const ok = await testConfig(port, user);
      if (ok) {
        console.log('Found working connection setup!');
        process.exit(0);
      }
    }
  }
  console.log('All SNI pooler configurations failed.');
}

main().catch(console.error);
