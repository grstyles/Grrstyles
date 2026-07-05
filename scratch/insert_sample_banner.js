require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleBanner() {
  console.log("Inserting sample banner...");
  
  const sampleBanner = {
    title: "Summer Collection 2026",
    subtitle: "Up to 50% Off",
    image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    mobile_image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
    link: "/collections/summer",
    button_text: "Shop Now",
    active: true,
    sort_order: 1,
    target_page: "home",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const { data, error } = await supabase.from('banners').insert([sampleBanner]).select('*').single();
  
  if (error) {
    console.error("Insert Error", error);
  } else {
    console.log("Successfully inserted sample banner:", data);
  }
}

insertSampleBanner();
