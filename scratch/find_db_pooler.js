const { Client } = require('pg');

async function testPoolers() {
  const regions = [
    'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1'
  ];

  const usernames = [
    'postgres.xqxnezvhrmyndpsfmrbc',
    'postgres'
  ];

  const ports = [5432, 6543];

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const port of ports) {
      for (const u of usernames) {
        const client = new Client({
          connectionString: `postgresql://${u}:Vyshur%40m14321@${host}:${port}/postgres`,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 3000
        });

        try {
          await client.connect();
          console.log(`🎉 SUCCESS! Region ${region}, host: ${host}, port: ${port}, user: ${u}`);
          const res = await client.query('SELECT 1');
          console.log('QueryResult:', res.rows);
          await client.end();
          return { region, host, port, user: u };
        } catch (err) {
          // ignore
          try { await client.end(); } catch(e) {}
        }
      }
    }
  }
  console.log('No pooler found');
}

testPoolers().catch(console.error);
