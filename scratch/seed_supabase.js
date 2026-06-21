// Standalone script to seed Supabase database tables with Categories, Collections, Coupons, and 63 Products.
// Run using: node scratch/seed_supabase.js
// Make sure to define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually if .env.local exists
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !process.env.SUPABASE_SERVICE_ROLE_KEY) supabaseKey = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !supabaseKey) supabaseKey = value;
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.log('----------------------------------------------------');
  console.log('Supabase credentials not found in environment or .env.local.');
  console.log('Gracefully skipping DB seeding. Fallback to local mock data is active.');
  console.log('----------------------------------------------------');
  process.exit(0);
}

// Strip /rest/v1/ suffix if it was added
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to normalize slugs in JavaScript
function normalizeSlug(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to normalize categories in JavaScript
function normalizeCategory(category) {
  if (!category) return '';
  const val = category.toLowerCase().trim().replace(/-/g, ' ');

  if (val === 'shirt' || val === 'shirts') return 'shirts';
  if (val === 'printed shirt' || val === 'printed shirts' || val === 'printed-shirt' || val === 'printed-shirts') return 'printed-shirts';
  if (val === 't shirt' || val === 'tshirts' || val === 't-shirt' || val === 't-shirts' || val === 't shirts' || val === 'tshirt' || val === 'polo shirt' || val === 'polo shirts') return 't-shirts';
  if (val === 'jacket' || val === 'jackets' || val === 'hoodie' || val === 'hoodies' || val === 'sweatshirt' || val === 'sweatshirts' || val === 'blazer' || val === 'blazers') return 'jackets';
  if (val === 'night track' || val === 'night tracks' || val === 'nighttrack' || val === 'night-tracks' || val === 'nighttracks') return 'night-tracks';
  if (val === 'formal pant' || val === 'formal pants' || val === 'formal-pant' || val === 'formal-pants' || val === 'pant' || val === 'pants') return 'formal-pant';
  if (val === 'formal shirt' || val === 'formal shirts' || val === 'formal-shirt' || val === 'formal-shirts') return 'formal-shirts';
  if (val === 'trouser' || val === 'trousers' || val === 'chinos' || val === 'chino' || val === 'cargo' || val === 'cargos') return 'trousers';
  if (val === 'jeans' || val === 'denim' || val === 'denim jeans' || val === 'denim-jeans') return 'denim-jeans';
  if (val === 'sneakers' || val === 'shoes' || val === 'sneaker' || val === 'shoe' || val === 'footwear') return 'shoes';
  if (val === 'accessories' || val === 'accessory' || val === 'watch' || val === 'watches' || val === 'belt' || val === 'belts' || val === 'wallet' || val === 'wallets' || val === 'cap' || val === 'caps' || val === 'sunglasses' || val === 'sunglass' || val === 'perfume' || val === 'perfumes') return 'accessories';

  return normalizeSlug(category);
}

// Helper to normalize collections in JavaScript
function normalizeCollection(collection) {
  if (!collection) return '';
  const val = collection.toLowerCase().trim().replace(/-/g, ' ');

  if (val === 'korean collection' || val === 'korean collections') return 'korean-collections';
  if (val === 'trending collection' || val === 'trending collections') return 'trending-collections';
  if (val === 'baggy pant' || val === 'baggy pants') return 'baggy-pants';
  if (val === 'korean trouser' || val === 'korean trousers') return 'korean-trousers';
  if (val === 'traditional collection' || val === 'traditional collections') return 'traditional-collections';
  if (val === 'festival collection' || val === 'festival collections' || val === 'festival wear') return 'festival-collections';
  if (val === 'combo offer' || val === 'combo offers' || val === 'combos') return 'combo-offers';
  if (val === 'festival offer' || val === 'festival offers') return 'festival-offers';
  if (val === 'weekend offer' || val === 'weekend offers') return 'weekend-offers';
  if (val === 'formal combo' || val === 'formal combos') return 'formal-combos';
  if (val === 'deal of the day' || val === 'deal of day' || val === 'deals') return 'deal-of-the-day';
  if (val === 'shoes' || val === 'shoe') return 'shoes';

  return normalizeSlug(collection);
}

// Categories Data
const categories = [
  { name: 'Shirts', slug: 'shirts', description: 'Refined shirts crafted from premium linen and cotton blends.', image: '/images/categories/printed_shirts.png' },
  { name: 'Printed Shirts', slug: 'printed-shirts', description: 'Trendy printed shirts in modern designs.', image: '/images/categories/printed_shirts.png' },
  { name: 'T-Shirts', slug: 't-shirts', description: 'Premium heavyweight and relaxed fit cotton tees.', image: '/images/categories/t_shirts.png' },
  { name: 'Jackets', slug: 'jackets', description: 'Bomber, utility, and denim jackets designed for layering.', image: '/images/categories/jackets.png' },
  { name: 'Night Tracks', slug: 'night-tracks', description: 'Comfortable loungewear and night track pants.', image: '/images/categories/category-placeholder.png' },
  { name: 'Accessories', slug: 'accessories', description: 'Essential premium leather wallets, belts, and timepieces.', image: '/images/categories/accessories.png' },
  { name: 'Formal Pant', slug: 'formal-pant', description: 'Sharp, tailored trousers for formal occasions.', image: '/images/categories/trousers.png' },
  { name: 'Formal Shirts', slug: 'formal-shirts', description: 'Crisp, structured button-downs for office wear.', image: '/images/categories/printed_shirts.png' },
  { name: 'Trousers', slug: 'trousers', description: 'Classic pleated and casual chinos.', image: '/images/categories/trousers.png' },
  { name: 'Denim Jeans', slug: 'denim-jeans', description: 'High-quality washed and distressed denim jeans.', image: '/images/categories/denim_jeans.png' },
  { name: 'Shoes', slug: 'shoes', description: 'Premium leather shoes and casual footwear.', image: '/images/categories/shoes.png' }
];

// Collections Data
const collections = [
  { name: 'Korean Collections', slug: 'korean-collections', description: 'Minimalist, oversized silhouettes inspired by modern Seoul street fashion.' },
  { name: 'Trending Collections', slug: 'trending-collections', description: 'Our most popular, high-demand menswear styles.' },
  { name: 'Baggy Pants', slug: 'baggy-pants', description: 'Comfortable, ultra-loose fit streetwear trousers.' },
  { name: 'Korean Trousers', slug: 'korean-trousers', description: 'Sleek, ankle-length pleated trousers inspired by K-fashion.' },
  { name: 'Shoes', slug: 'shoes', description: 'Minimalist sneakers, loafers, and boots.' },
  { name: 'Traditional Collections', slug: 'traditional-collections', description: 'Traditional and heritage wear for special occasions.' },
  { name: 'Festival Collections', slug: 'festival-collections', description: 'Bright colors and premium fabrics tailored for festive celebrations.' },
  { name: 'Combo Offers', slug: 'combo-offers', description: 'Exclusive value packs and bundled products.' },
  { name: 'Festival Offers', slug: 'festival-offers', description: 'Special seasonal discounts on premium festival wear.' },
  { name: 'Weekend Offers', slug: 'weekend-offers', description: 'Special casual clothing deals for the weekend.' },
  { name: 'Formal Combos', slug: 'formal-combos', description: 'Sharp office shirts and structured trousers paired at a bundle discount.' },
  { name: 'Deal Of The Day', slug: 'deal-of-the-day', description: 'Exclusive handpicked offers and time-limited deals.' }
];

// Coupons Data
const coupons = [
  { code: 'WELCOME10', discount_percent: 10, description: '10% off on your first order', is_active: true },
  { code: 'WEEKEND10', discount_percent: 10, description: '10% off for weekend specials', is_active: true },
  { code: 'FESTIVAL20', discount_percent: 20, description: '20% discount on festive wear orders', is_active: true }
];

// Load Products from typescript file by parsing it or listing static values.
// Since it is a TS file, we can require a transpiled version or define a seed JSON.
// To make it 100% reliable without typescript compilers, we extract the products from lib/data/products.ts or define them here.
// Let's read products.ts and dynamically parse or define the products database in JS format.
// We can parse products.ts array by searching for patterns, or just read the JSON file if available.
// Since we have products.ts, let's write a parser helper inside this script to extract products.
function parseProducts() {
  try {
    const parsedDB = require('../lib/data/products').productDatabase;
    return Object.values(parsedDB);
  } catch (err) {
    console.error('Regex parse failed. Initializing standard seed values.');
    return [];
  }
}

async function seed() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  
  // 1. Seed Categories
  console.log('Seeding Categories...');
  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.error(`Error category ${cat.name}:`, error.message);
  }
  console.log('Categories seeded.');

  // 2. Seed Collections
  console.log('Seeding Collections...');
  for (const col of collections) {
    const { error } = await supabase.from('collections').upsert(col, { onConflict: 'slug' });
    if (error) console.error(`Error collection ${col.name}:`, error.message);
  }
  console.log('Collections seeded.');

  // 3. Seed Coupons
  console.log('Seeding Coupons...');
  for (const coupon of coupons) {
    const { error } = await supabase.from('coupons').upsert(coupon, { onConflict: 'code' });
    if (error) console.error(`Error coupon ${coupon.code}:`, error.message);
  }
  console.log('Coupons seeded.');

  // 3. Seed Products
  console.log('Parsing products from products.ts...');
  const items = parseProducts();
  console.log(`Found ${items.length} products to seed.`);
  
  if (items.length === 0) {
    console.error('No products parsed. Aborting product seed.');
    return;
  }
  
  for (const p of items) {
    let catVal = p.category;
    // Map watch products specifically to watches
    if (catVal === 'Accessories' && (p.name.toLowerCase().includes('watch') || p.title.toLowerCase().includes('watch'))) {
      catVal = 'watches';
    }

    const mapped = {
      product_id: p.id,
      sku: p.sku || `GR-SKU-${p.id}-${normalizeSlug(p.slug).slice(0, 3).toUpperCase()}`,
      name: p.name || p.title,
      slug: normalizeSlug(p.slug),
      category: normalizeCategory(catVal),
      collection: p.collection ? normalizeCollection(p.collection) : '',
      color: p.color,
      images: p.images,
      sizes: p.sizes, // JSONB structure
      mrp_price: p.mrpPrice || p.price,
      selling_price: p.sellingPrice || p.discountedPrice || p.price,
      discount_percent: p.discountPercent || 0,
      label: p.label || '',
      description: p.description,
      featured: p.featured || false,
      trending: p.trending || false,
      new_arrival: p.isNew || false,
      deal_of_the_day: p.dealOfTheDay || false,
      brand: p.brand || 'GR STYLES',
      rating: p.rating || 5.0,
      reviews_count: p.reviews || 0
    };
    
    const { error } = await supabase.from('products').upsert(mapped, { onConflict: 'slug' });
    if (error) {
      console.error(`Error product ${p.name}:`, error.message);
    }
  }
  console.log('Products seeding complete.');
}

seed().catch(err => {
  console.error('Seeding runtime error:', err);
});
