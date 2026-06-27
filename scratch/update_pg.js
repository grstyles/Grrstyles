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
    
    await client.query(`
      UPDATE products 
      SET image_colors = '[{"image_url": "/test.jpg", "color_name": "White", "display_order": 0}]'::jsonb 
      WHERE slug = 'oxford-premium-shirts';
    `);
    
    const res = await client.query(`
      SELECT slug, image_colors
      FROM products 
      WHERE slug = 'oxford-premium-shirts'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
run();
