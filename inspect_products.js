const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const resProducts = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    console.log('products columns:', resProducts.rows.map(r => `${r.column_name}: ${r.data_type}`));
    await client.end();
  } catch (err) {
    console.error('Error connecting to raw IPv6:', err);
  }
}

run();
