const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- RUNNING CAROUSEL MIGRATION ---');

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
    console.log('Connected to DB via PG!');

    // Create table and storage bucket
    const sql = `
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

      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('category-images', 'category-images', true)
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(sql);
    console.log('Table and Bucket created via SQL.');

    // RLS Policy for storage (if needed, making it public)
    const policySql = `
      -- Allow public access to bucket objects
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
      CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images');
      CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images');
      CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'category-images');
    `;
    try { await client.query(policySql); } catch(e) { console.log('Policies likely exist already'); }

    // Fetch actual products to grab images
    const { data: products } = await supabase.from('products').select('category, images');

    const defaultCategories = [
      { title: 'Shirts', slug: 'shirts', bg_color: '#F5F5DC', search_cat: 'Shirts' },
      { title: 'Printed Shirts', slug: 'printed-shirts', bg_color: '#F8DE7E', search_cat: 'Printed Shirts' },
      { title: 'Oversized T-Shirts', slug: 'oversized-t-shirts', bg_color: '#FFFDD0', search_cat: 'T-Shirts' },
      { title: 'Polos', slug: 'polos', bg_color: '#808000', search_cat: 'T-Shirts' }, 
      { title: 'Trousers', slug: 'trousers', bg_color: '#C2B280', search_cat: 'Trousers' },
      { title: 'Cargo Pants', slug: 'cargo-pants', bg_color: '#B5651D', search_cat: 'Trousers' }, 
      { title: 'Jeans', slug: 'jeans', bg_color: '#1560BD', search_cat: 'Jeans' },
      { title: 'Shorts', slug: 'shorts', bg_color: '#708090', search_cat: 'Shorts' },
      { title: 'Formal Wear', slug: 'formal-wear', bg_color: '#000080', search_cat: 'Formal Pant' },
      { title: 'Blazers', slug: 'blazers', bg_color: '#800000', search_cat: 'Jackets' },
      { title: 'Jackets', slug: 'jackets', bg_color: '#A9A9A9', search_cat: 'Jackets' },
      { title: 'Ethnic Wear', slug: 'ethnic-wear', bg_color: '#FFDB58', search_cat: 'Traditional' },
      { title: 'Accessories', slug: 'accessories', bg_color: '#FFFFF0', search_cat: 'Accessories' },
      { title: 'Shoes', slug: 'shoes', bg_color: '#36454F', search_cat: 'Shoes' },
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

      await client.query(`
        INSERT INTO category_carousel (title, slug, image_url, bg_color, priority)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE 
        SET image_url = EXCLUDED.image_url, bg_color = EXCLUDED.bg_color;
      `, [cat.title, cat.slug, imageUrl, cat.bg_color, count++]);
    }

    console.log('Categories populated successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run().catch(console.error);
