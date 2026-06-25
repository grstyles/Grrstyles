const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1'
];

async function testRegionPort(region, port) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    host: host,
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: port,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`Region ${region} (${host}) on port ${port} SUCCESS!`);
    const res = await client.query('SELECT 1');
    console.log('Query successful:', res.rows);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Region ${region} (${host}) on port ${port} error:`, err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  for (const region of regions) {
    for (const port of [5432, 6543]) {
      const ok = await testRegionPort(region, port);
      if (ok) {
        console.log(`Found working config: ${region} on port ${port}`);
        process.exit(0);
      }
    }
  }
}

run().catch(err => console.error('Unhandled error in run:', err));
