const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ipv6ConnectionString = "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:6543/postgres";
const ipv6DirectString = "postgresql://postgres:Vyshur%40m14321@[2406:da1a:314:7101:cccf:b11a:1dab:61df]:5432/postgres";

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'marketing_migration.sql'), 'utf8');
  let success = false;
  
  try {
    const client = new Client({ connectionString: ipv6ConnectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(sql);
    await client.end();
    success = true;
    console.log('Migration OK on port 6543');
  } catch(e) {
    console.log('Failed on 6543:', e.message);
  }
  
  if (!success) {
    try {
      const client = new Client({ connectionString: ipv6DirectString, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query(sql);
      await client.end();
      console.log('Migration OK on port 5432');
    } catch(e) {
      console.log('Failed on 5432:', e.message);
    }
  }
}
run().catch(console.error);
