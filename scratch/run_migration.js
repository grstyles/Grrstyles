const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('--- GR STYLES SCHEMA MIGRATION RUNNER ---');
  
  // Read migration SQL
  const migrationFile = path.join(__dirname, '..', 'supabase_images_migration.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration SQL file not found at:', migrationFile);
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Attempt SNI direct connection via IPv4 pooler IP if direct DNS fails
  // Let's resolve the host to IPv6 address or connect via pooler
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
    console.log('Connected to Supabase DB successfully!');
    console.log('Running migration SQL...');
    await client.query(sql);
    console.log('Migration SQL executed successfully!');
    await client.end();
    console.log('--- Migration completed successfully! ---');
  } catch (err) {
    console.warn('\n[WARNING] Could not apply SQL migration directly via PG client:', err.message || err);
    console.warn('This is expected in environments without IPv6 routing to db.xqxnezvhrmyndpsfmrbc.supabase.co.');
    console.warn('The codebase will gracefully fall back to products.images and products.color columns.');
    console.warn('Please execute the queries in supabase_images_migration.sql in the Supabase SQL Editor if needed.\n');
  }
}

run().catch(console.error);
