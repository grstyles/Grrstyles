const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function triggerReload() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Vyshur%40m14321@db.xqxnezvhrmyndpsfmrbc.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Sometimes creating a view forces PostgREST to reload
    await client.query(`
      CREATE OR REPLACE VIEW public.vw_banners AS SELECT * FROM public.banners;
      GRANT ALL ON public.vw_banners TO anon, authenticated, service_role;
      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log('Triggered reload attempt via view creation.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

triggerReload();
