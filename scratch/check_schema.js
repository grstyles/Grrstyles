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

  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT column_name, column_default, data_type
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'image_colors';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
run();
