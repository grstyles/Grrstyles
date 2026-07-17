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
    console.log('Connected to database.');

    const resOrders = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log('=== orders columns ===');
    resOrders.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    const resOrderItems = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
    `);
    console.log('=== order_items columns ===');
    resOrderItems.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    const totalOrders = await client.query(`
      SELECT count(*) FROM orders
    `);
    console.log('Total orders in DB:', totalOrders.rows[0].count);

    await client.end();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

run();
