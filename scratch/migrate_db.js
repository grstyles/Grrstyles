const { Client } = require('pg');

const ipv6ConnectionString = "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:6543/postgres";
const ipv6DirectString = "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:5432/postgres";

async function runMigrationForClient(client) {
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  // Check columns of public.products
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products';
  `);
  
  const columns = res.rows.map(r => r.column_name);
  console.log('Current columns in products table:', res.rows.map(r => `${r.column_name}: ${r.data_type}`));

  if (!columns.includes('color')) {
    console.log('Adding color column...');
    await client.query('ALTER TABLE public.products ADD COLUMN color text DEFAULT \'\';');
    console.log('color column added successfully.');
  } else {
    console.log('color column already exists.');
  }

  if (!columns.includes('image_colors')) {
    console.log('Adding image_colors column...');
    await client.query('ALTER TABLE public.products ADD COLUMN image_colors jsonb DEFAULT \'[]\'::jsonb;');
    console.log('image_colors column added successfully.');
  } else {
    console.log('image_colors column already exists.');
  }

  const checkAfter = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products';
  `);
  console.log('Columns in products table after migration:', checkAfter.rows.map(r => r.column_name));
}

async function main() {
  console.log('Trying pooler IPv6 connection on port 6543...');
  let success = false;
  try {
    const client = new Client({
      connectionString: ipv6ConnectionString,
      ssl: { rejectUnauthorized: false }
    });
    await runMigrationForClient(client);
    await client.end();
    success = true;
    console.log('Migration completed successfully on port 6543!');
  } catch (err) {
    console.error('Failed on port 6543:', err.message || err);
  }

  if (!success) {
    console.log('Trying direct IPv6 connection on port 5432...');
    try {
      const client = new Client({
        connectionString: ipv6DirectString,
        ssl: { rejectUnauthorized: false }
      });
      await runMigrationForClient(client);
      await client.end();
      console.log('Migration completed successfully on port 5432!');
    } catch (err) {
      console.error('Failed on port 5432:', err.message || err);
    }
  }
}

main().catch(console.error);
