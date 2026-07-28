const { Client } = require('pg');

async function testConnections() {
  const hosts = [
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'db.xqxnezvhrmyndpsfmrbc.supabase.co'
  ];

  for (const host of hosts) {
    console.log(`Testing host: ${host}`);
    const client = new Client({
      connectionString: `postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@${host}:5432/postgres`,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`SUCCESS connected to ${host} on port 5432!`);
      const res = await client.query('SELECT 1');
      console.log('Query result:', res.rows);
      await client.end();
      return host;
    } catch (err) {
      console.log(`Port 5432 on ${host} error:`, err.message);
      try { await client.end(); } catch(e) {}
    }

    // Try port 6543
    const client6543 = new Client({
      connectionString: `postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client6543.connect();
      console.log(`SUCCESS connected to ${host} on port 6543!`);
      const res = await client6543.query('SELECT 1');
      console.log('Query result:', res.rows);
      await client6543.end();
      return host;
    } catch (err) {
      console.log(`Port 6543 on ${host} error:`, err.message);
      try { await client6543.end(); } catch(e) {}
    }
  }
}

testConnections().catch(console.error);
