const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new Client({
  host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Vyshur@m14321',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PG database successfully.');

    // 1. Create table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.shipping_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CONSTRAINT single_row CHECK (id = 1),
        shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
        free_shipping_above NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await client.query(createTableSql);
    console.log('Table shipping_settings created successfully.');

    // 2. Insert initial row if not exists
    const insertInitialRowSql = `
      INSERT INTO public.shipping_settings (id, shipping_charge, free_shipping_above)
      VALUES (1, 100.00, 2000.00)
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(insertInitialRowSql);
    console.log('Initial shipping settings row seeded.');

    // 3. Configure RLS Policies
    const rlsSql = `
      ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read access for shipping_settings" ON public.shipping_settings;
      CREATE POLICY "Allow public read access for shipping_settings"
        ON public.shipping_settings FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "Allow admin write access for shipping_settings" ON public.shipping_settings;
      CREATE POLICY "Allow admin write access for shipping_settings"
        ON public.shipping_settings FOR ALL
        USING (public.is_admin());
    `;
    await client.query(rlsSql);
    console.log('RLS policies configured successfully.');

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
