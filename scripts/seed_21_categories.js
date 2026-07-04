require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

async function seed() {
  console.log("Starting DB Seed for 21 Premium Categories...");
  
  // 1. Delete all existing categories to prevent duplicates or incorrect priority
  const { error: delError } = await supabase
    .from('category_carousel')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
  if (delError) {
    console.error("Error deleting old categories:", delError);
    return;
  }
  
  console.log("Deleted old categories.");

  // 2. Insert new categories with proper priority
  const records = categories.map((cat, idx) => ({
    title: cat.title,
    slug: cat.slug,
    image_url: cat.image_url,
    bg_color: '#F9F7F5', // luxury beige/cream as requested
    priority: idx,
    enabled: true,
    featured: false,
    redirect_link: `/collections/${cat.slug}`
  }));

  const { data, error } = await supabase
    .from('category_carousel')
    .insert(records)
    .select();

  if (error) {
    console.error("Error inserting categories:", error);
  } else {
    console.log(`Successfully inserted ${data.length} categories.`);
  }
}

seed();
