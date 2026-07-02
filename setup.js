const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- SETUP CAROUSEL VIA REST API ---');

  try {
    // 1. Create Bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets || !buckets.find(b => b.name === 'category-images')) {
      console.log('Creating category-images bucket...');
      const { error } = await supabase.storage.createBucket('category-images', { public: true });
      if (error) console.error('Bucket creation error:', error);
      else console.log('Bucket created successfully!');
    } else {
      console.log('Bucket already exists.');
    }

    // 2. Fetch products to get default images
    const { data: products } = await supabase.from('products').select('category, images');

    const defaultCategories = [
      { id: crypto.randomUUID(), title: 'Shirts', slug: 'shirts', bg_color: '#f5f0eb', search_cat: 'Shirts' },
      { id: crypto.randomUUID(), title: 'Printed Shirts', slug: 'printed-shirts', bg_color: '#ebd6a7', search_cat: 'Printed Shirts' },
      { id: crypto.randomUUID(), title: 'Oversized T-Shirts', slug: 'oversized-t-shirts', bg_color: '#f7f4ea', search_cat: 'T-Shirts' },
      { id: crypto.randomUUID(), title: 'Polos', slug: 'polos', bg_color: '#e4eadf', search_cat: 'T-Shirts' }, 
      { id: crypto.randomUUID(), title: 'Trousers', slug: 'trousers', bg_color: '#e8e6e1', search_cat: 'Trousers' },
      { id: crypto.randomUUID(), title: 'Cargo Pants', slug: 'cargo-pants', bg_color: '#d6c7b6', search_cat: 'Trousers' }, 
      { id: crypto.randomUUID(), title: 'Jeans', slug: 'jeans', bg_color: '#dbe4ed', search_cat: 'Jeans' },
      { id: crypto.randomUUID(), title: 'Shorts', slug: 'shorts', bg_color: '#dfdfdf', search_cat: 'Shorts' },
      { id: crypto.randomUUID(), title: 'Formal Wear', slug: 'formal-wear', bg_color: '#dbe0ea', search_cat: 'Formal' },
      { id: crypto.randomUUID(), title: 'Blazers', slug: 'blazers', bg_color: '#ebdcd6', search_cat: 'Jackets' },
      { id: crypto.randomUUID(), title: 'Jackets', slug: 'jackets', bg_color: '#e3e4e6', search_cat: 'Jackets' },
      { id: crypto.randomUUID(), title: 'Ethnic Wear', slug: 'ethnic-wear', bg_color: '#f2e9c2', search_cat: 'Traditional' },
      { id: crypto.randomUUID(), title: 'Accessories', slug: 'accessories', bg_color: '#f2f1ef', search_cat: 'Accessories' },
      { id: crypto.randomUUID(), title: 'Shoes', slug: 'shoes', bg_color: '#e4e5e7', search_cat: 'Shoes' },
    ];

    const finalCategories = defaultCategories.map(cat => {
      let imageUrl = null;
      if (products) {
        const prod = products.find(p => p.category && p.category.toLowerCase().includes(cat.search_cat.toLowerCase()) && p.images && p.images.length > 0);
        if (prod) {
          imageUrl = prod.images[0];
        }
      }
      if (!imageUrl) {
        imageUrl = '/images/categories/' + cat.slug.replace('-', '_') + '.png';
      }
      return {
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        image_url: imageUrl,
        bg_color: cat.bg_color,
        enabled: true
      };
    });

    // 3. Upsert into marketing_config
    const { error } = await supabase.from('marketing_config').upsert({
      key: 'category_carousel',
      value: finalCategories,
      enabled: true
    }, { onConflict: 'key' });

    if (error) {
      console.error('Failed to upsert marketing_config:', error);
    } else {
      console.log('Successfully seeded category_carousel in marketing_config!');
    }

  } catch (err) {
    console.error('Setup failed:', err);
  }
}

run().catch(console.error);
