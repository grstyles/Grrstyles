const { Client } = require('pg');

async function run() {
  const ipv6ConnectionString = "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:6543/postgres";
  const client = new Client({ connectionString: ipv6ConnectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to PG database successfully.');

    await client.query(`
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric(10, 2);
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_amount numeric(10, 2) DEFAULT 0;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10, 2) DEFAULT 0;
    `);
    console.log('Successfully added subtotal, shipping_amount, tax_amount columns to orders table!');
    await client.end();
  } catch (err) {
    console.error('Error running pg query:', err.message);
  }
}

run();
