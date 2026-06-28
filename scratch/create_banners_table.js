const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Vyshur%40m14321@db.xqxnezvhrmyndpsfmrbc.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const query = `
      CREATE TABLE IF NOT EXISTS public.banners (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        image_url TEXT NOT NULL,
        mobile_image_url TEXT,
        link_url TEXT,
        button_text TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        target_page TEXT DEFAULT 'home',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      -- Enable RLS
      ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

      -- Create Policies
      DROP POLICY IF EXISTS "Enable read access for all users on banners" ON public.banners;
      CREATE POLICY "Enable read access for all users on banners" 
        ON public.banners FOR SELECT 
        USING (true);

      DROP POLICY IF EXISTS "Enable all access for admins on banners" ON public.banners;
      CREATE POLICY "Enable all access for admins on banners" 
        ON public.banners FOR ALL 
        USING (true)
        WITH CHECK (true);

      -- Grant permissions to authenticated and anon roles
      GRANT ALL ON public.banners TO authenticated;
      GRANT ALL ON public.banners TO anon;
      GRANT ALL ON public.banners TO service_role;

      -- Supabase Storage bucket for banners
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('banners', 'banners', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      -- Storage policies
      DROP POLICY IF EXISTS "Banners are publicly accessible" ON storage.objects;
      CREATE POLICY "Banners are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'banners');

      DROP POLICY IF EXISTS "Anyone can insert banners" ON storage.objects;
      CREATE POLICY "Anyone can insert banners"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'banners');
        
      DROP POLICY IF EXISTS "Anyone can update banners" ON storage.objects;
      CREATE POLICY "Anyone can update banners"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'banners');

      DROP POLICY IF EXISTS "Anyone can delete banners" ON storage.objects;
      CREATE POLICY "Anyone can delete banners"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'banners');

      -- Let postgrest know about the schema changes
      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(query);
    console.log('Successfully created banners table and storage bucket.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
