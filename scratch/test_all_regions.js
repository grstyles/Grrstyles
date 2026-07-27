const { Client } = require('pg');

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1'
];

async function checkRegion(r) {
  const host = `aws-0-${r}.pooler.supabase.com`;
  const client = new Client({
    connectionString: `postgresql://postgres.xqxnezvhrmyndpsfmrbc:Vyshur%40m14321@${host}:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`SUCCESS REGION: ${r}!`);
    const res = await client.query('SELECT 1;');
    console.log(res.rows);
    await client.end();
    return true;
  } catch (err) {
    if (!err.message.includes('not found')) {
      console.log(`Region ${r} different error:`, err.message);
    }
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  for (const r of regions) {
    const ok = await checkRegion(r);
    if (ok) break;
  }
}

run();
