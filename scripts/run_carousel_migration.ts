import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { Client } from 'pg';

const envPath = path.join(process.cwd(), '.env.local');
let NEXT_PUBLIC_SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') NEXT_PUBLIC_SUPABASE_URL = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') SUPABASE_SERVICE_ROLE_KEY = value;
    }
  });
}

const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- RUNNING CAROUSEL MIGRATION ---');

  const pgClient = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log('Connected to DB via pg!');

    // First create table
    const sql1 = `
      CREATE TABLE IF NOT EXISTS category_carousel (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          image_url TEXT,
          bg_color TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await pgClient.query(sql1);
    console.log('Table category_carousel created!');

    // Create bucket via pg (storage.buckets)
    const sqlBucket = `
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('category-images', 'category-images', true)
      ON CONFLICT (id) DO NOTHING;
    `;
    await pgClient.query(sqlBucket);
    
    // RLS Policy for storage (if needed, making it public)
    const policySql = `
      -- Allow public access to bucket objects
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
      CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images');
      CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images');
      CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'category-images');
    `;
    try { await pgClient.query(policySql); } catch(e) { }
    console.log('Bucket configured!');

    // Fetch actual products to grab images
    const { data: products } = await supabase.from('products').select('category, images');

    const defaultCategories = [
      { title: 'Shirts', slug: 'shirts', bg_color: '#f5f0eb', search_cat: 'Shirts' },
      { title: 'Printed Shirts', slug: 'printed-shirts', bg_color: '#ebd6a7', search_cat: 'Printed Shirts' },
      { title: 'Oversized T-Shirts', slug: 'oversized-t-shirts', bg_color: '#f7f4ea', search_cat: 'T-Shirts' },
      { title: 'Polos', slug: 'polos', bg_color: '#e4eadf', search_cat: 'T-Shirts' }, 
      { title: 'Trousers', slug: 'trousers', bg_color: '#e8e6e1', search_cat: 'Trousers' },
      { title: 'Cargo Pants', slug: 'cargo-pants', bg_color: '#d6c7b6', search_cat: 'Trousers' }, 
      { title: 'Jeans', slug: 'jeans', bg_color: '#dbe4ed', search_cat: 'Jeans' },
      { title: 'Shorts', slug: 'shorts', bg_color: '#dfdfdf', search_cat: 'Shorts' },
      { title: 'Formal Wear', slug: 'formal-wear', bg_color: '#dbe0ea', search_cat: 'Formal' },
      { title: 'Blazers', slug: 'blazers', bg_color: '#ebdcd6', search_cat: 'Jackets' },
      { title: 'Jackets', slug: 'jackets', bg_color: '#e3e4e6', search_cat: 'Jackets' },
      { title: 'Ethnic Wear', slug: 'ethnic-wear', bg_color: '#f2e9c2', search_cat: 'Traditional' },
      { title: 'Accessories', slug: 'accessories', bg_color: '#f2f1ef', search_cat: 'Accessories' },
      { title: 'Shoes', slug: 'shoes', bg_color: '#e4e5e7', search_cat: 'Shoes' },
    ];

    let count = 0;
    for (const cat of defaultCategories) {
      // Find a matching product image
      let imageUrl = null;
      if (products) {
        const prod = products.find(p => p.category && p.category.toLowerCase().includes(cat.search_cat.toLowerCase()) && p.images && p.images.length > 0);
        if (prod) {
          imageUrl = prod.images[0];
        }
      }
      
      // Fallback
      if (!imageUrl) {
        imageUrl = '/images/categories/' + cat.slug.replace('-', '_') + '.png';
      }

      await pgClient.query(`
        INSERT INTO category_carousel (title, slug, image_url, bg_color, priority)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE 
        SET image_url = EXCLUDED.image_url, bg_color = EXCLUDED.bg_color;
      `, [cat.title, cat.slug, imageUrl, cat.bg_color, count++]);
    }

    console.log('Categories populated successfully!');
    await pgClient.end();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run().catch(console.error);
