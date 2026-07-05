const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function reloadCache() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Vyshur%40m14321@db.xqxnezvhrmyndpsfmrbc.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Explicitly grant permissions again just in case
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;');
    
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log('Notified PostgREST to reload schema cache.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

reloadCache();
