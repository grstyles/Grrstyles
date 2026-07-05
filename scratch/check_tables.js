const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Vyshur%40m14321@db.xqxnezvhrmyndpsfmrbc.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

checkTables();
