const { Client } = require('pg');

const categories = [
  { title: "Combo Offers", slug: "combo-offers", image_url: "/images/categories/home_hero_banner_1781859591521.png" },
  { title: "Korean Collections", slug: "korean-collections", image_url: "/images/categories/korean_collection_1781859616593.png" },
  { title: "Baggy Pants", slug: "baggy-pants", image_url: "/images/categories/baggy_pants_1782999816436.png" },
  { title: "Korean Trousers", slug: "korean-trousers", image_url: "/images/categories/trousers_1781973187005.png" },
  { title: "Shoes", slug: "shoes", image_url: "/images/categories/shoes_1781859704333.png" },
  { title: "Traditional Collections", slug: "traditional-collections", image_url: "/images/categories/festival_wear.png" },
  { title: "Festival Collections", slug: "festival-collections", image_url: "/images/categories/festival_collection_1781859912718.png" },
  { title: "Trending Collections", slug: "trending-collections", image_url: "/images/categories/weekend_collection_1781859935252.png" },
  { title: "Shirts", slug: "shirts", image_url: "/images/categories/shirts_1782999677203.png" },
  { title: "T-Shirts", slug: "t-shirts", image_url: "/images/categories/t_shirts_1781973106261.png" },
  { title: "Jackets", slug: "jackets", image_url: "/images/categories/jackets_1782999862529.png" },
  { title: "Night Tracks", slug: "night-tracks", image_url: "/images/categories/sweatshirts_1782999892937.png" },
  { title: "Accessories", slug: "accessories", image_url: "/images/categories/accessories_1781859683256.png" },
  { title: "Formal Combos", slug: "formal-combos", image_url: "/images/categories/blazers_1781973264858.png" },
  { title: "Formal Pants", slug: "formal-pants", image_url: "/images/categories/formal_pants_1782999794308.png" },
  { title: "Formal Shirts", slug: "formal-shirts", image_url: "/images/categories/formal_shirts_1782999741005.png" },
  { title: "Trousers", slug: "trousers", image_url: "/images/categories/trousers_1782999782089.png" },
  { title: "Denim Jeans", slug: "denim-jeans", image_url: "/images/categories/denim_jeans_1781859861521.png" },
  { title: "Printed Shirts", slug: "printed-shirts", image_url: "/images/categories/printed_shirts_1782999700299.png" },
  { title: "Festival Offers", slug: "festival-offers", image_url: "/images/categories/banner_4_1782126942281.png" },
  { title: "Weekend Offers", slug: "weekend-offers", image_url: "/images/categories/banner_5_1782126961549.png" }
];

async function run() {
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

    const createSql = `
      CREATE TABLE IF NOT EXISTS category_carousel (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          image_url TEXT,
          bg_color TEXT,
          priority INTEGER DEFAULT 0,
          enabled BOOLEAN DEFAULT TRUE,
          featured BOOLEAN DEFAULT FALSE,
          redirect_link TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;
    await pgClient.query(createSql);
    console.log('Table category_carousel ensured.');

    // Ensure columns exist (in case it was partially created)
    try { await pgClient.query('ALTER TABLE category_carousel ADD COLUMN featured BOOLEAN DEFAULT FALSE;'); } catch(e) {}
    try { await pgClient.query('ALTER TABLE category_carousel ADD COLUMN redirect_link TEXT;'); } catch(e) {}
    try { await pgClient.query('ALTER TABLE category_carousel ADD COLUMN bg_color TEXT;'); } catch(e) {}
    
    // Wipe old categories
    await pgClient.query('DELETE FROM category_carousel;');
    console.log('Wiped old categories.');

    // Insert new 21 categories
    let values = [];
    categories.forEach((cat, idx) => {
        values.push(`('${cat.title.replace(/'/g, "''")}', '${cat.slug}', '${cat.image_url}', '#F9F7F5', ${idx}, true, false, '/collections/${cat.slug}')`);
    });

    const insertSql = `
        INSERT INTO category_carousel (title, slug, image_url, bg_color, priority, enabled, featured, redirect_link)
        VALUES ${values.join(', ')};
    `;
    await pgClient.query(insertSql);
    console.log(`Successfully seeded ${categories.length} premium categories.`);
    
    // Also enable public read access to category_carousel via RLS
    try {
        await pgClient.query(`ALTER TABLE category_carousel ENABLE ROW LEVEL SECURITY;`);
        await pgClient.query(`CREATE POLICY "Public Read Access" ON category_carousel FOR SELECT USING (true);`);
    } catch(e) { console.log('RLS setup error (likely already exists):', e.message); }

    // RLS Policy for storage (if needed, making it public)
    try { 
        await pgClient.query(`INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true) ON CONFLICT (id) DO NOTHING;`);
        await pgClient.query(`CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');`);
        await pgClient.query(`CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images');`);
        await pgClient.query(`CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images');`);
        await pgClient.query(`CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'category-images');`);
    } catch(e) { }

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await pgClient.end();
  }
}

run();
